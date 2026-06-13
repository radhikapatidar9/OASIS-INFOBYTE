import "../cssFiles/ingredientList.css";

export default function IngredientList({
    title,
    ingredients,
    selectedItem,
    onSelect
}) {
    return (
        <div className="ingredient_list_container">

            <h2 className="ingredient_title">
                {title}
            </h2>

            <div className="ingredient_container">

                {
                    ingredients.map((item) => (

                        <div
                            key={item._id}
                            className={`ingredient_card ${
                                selectedItem?._id === item._id
                                    ? "selected"
                                    : ""
                            }`}
                        >

                            <img
                                className="ingredient_image"
                                src={item.image}
                                alt={item.name}
                            />

                            <h3 className="ingredient_name">
                                {item.name}
                            </h3>

                            <p className="ingredient_price">
                                ₹{item.price}
                            </p>

                            <p className="ingredient_stock">
                                Stock: {item.stock}
                            </p>

                            <button
                                className="ingredient_select_btn"
                                disabled={item.stock <= 0}
                                onClick={() => onSelect(item)}
                            >
                                {
                                    selectedItem?._id === item._id
                                        ? "Selected"
                                        : item.stock > 0
                                            ? "Select"
                                            : "Out of Stock"
                                }
                            </button>

                        </div>

                    ))
                }

            </div>

        </div>
    );
}