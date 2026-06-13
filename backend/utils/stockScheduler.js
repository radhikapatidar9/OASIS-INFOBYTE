const Ingredient = require('../models/Ingredients');
const User = require('../models/User');
const mailSender = require('./mailSender');
const cron = require('node-cron');

let lastEmailedItems = new Set();
let lastAlertTime = 0;

async function checkStockAndNotify() {
    try {
        const lowStockIngredients = await Ingredient.find({
            $expr: { $lt: ["$stock", "$threshold"] }
        });
        
        if (lowStockIngredients.length === 0) {
            // Reset state if no items are low stock
            lastEmailedItems.clear();
            return;
        }

        const currentLowStockIds = lowStockIngredients.map(item => item._id.toString());
        const hasNewLowStockItem = currentLowStockIds.some(id => !lastEmailedItems.has(id));

        // Cooldown of 12 hours for email notifications, unless a new low-stock item is detected
        const now = Date.now();
        const twelveHours = 12 * 60 * 60 * 1000;
        if (!hasNewLowStockItem && (now - lastAlertTime < twelveHours)) {
            console.log("Stock check: Low-stock items present, but notification is in cooldown.");
            return;
        }

        // Send alert
        const admins = await User.find({ role: 'admin' });
        const adminEmails = admins.map(a => a.email);
        if (process.env.MAIL_USER && !adminEmails.includes(process.env.MAIL_USER)) {
            adminEmails.push(process.env.MAIL_USER);
        }

        if (adminEmails.length === 0) {
            console.log("Stock check: No admins found to notify.");
            return;
        }

        const itemsListHtml = lowStockIngredients.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; border: 1px solid #ddd;"><b>${item.name}</b></td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #b70000; font-weight: bold;">${item.stock}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.threshold}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.type}</td>
            </tr>
        `).join('');

        const title = `⚠️ Scheduled Stock Alert: ${lowStockIngredients.length} Low-Inventory Items`;
        const body = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
                <h2 style="color: #d9534f; margin-top: 0;">⚠️ Low Stock Inventory Report</h2>
                <p>Hello Admin,</p>
                <p>This is a scheduled inventory health check. The following pizza ingredients have stock levels below their safety threshold:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Ingredient Name</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Stock Left</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Threshold</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsListHtml}
                    </tbody>
                </table>
                
                <p style="margin-top: 20px;">Please log in to the Admin Panel to replenish these items to ensure uninterrupted order processing.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">Pizza Customizer System - Scheduled Alert Service</p>
            </div>
        `;

        for (const email of adminEmails) {
            await mailSender(email, title, body);
            console.log(`Sent scheduled low-stock report to: ${email}`);
        }

        // Update state
        lastEmailedItems = new Set(currentLowStockIds);
        lastAlertTime = now;

    } catch (error) {
        console.error("Error running scheduled stock checker:", error);
    }
}

function startStockScheduler() {
    // Run once on startup (with a small delay to allow DB connection to fully stabilize)
    setTimeout(checkStockAndNotify, 10000);

    // Run every hour
    cron.schedule('0 * * * *', () => {
        console.log("Running hourly stock check...");
        checkStockAndNotify();
    });
    
    console.log("Stock inventory monitoring scheduler started.");
}

module.exports = startStockScheduler;
