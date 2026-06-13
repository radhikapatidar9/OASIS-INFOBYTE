import {createBrowserRouter, RouterProvider, Navigate} from 'react-router-dom'
import MainNavigation from './components/MainNavigation'
import AuthForm from './pages/AuthForm'
import Home from './pages/Home'
import axios from 'axios'
import './App.css'
import Ingredient from './components/Ingredient'
import CustomizePizza from './pages/CustomizePizza'
import Orders from './pages/Orders'
import AdminDashboard from './pages/AdminDashboard'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/authform" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token) {
    return <Navigate to="/authform" replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

const getAllVariety = async() => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/getvariety')
      console.log(response);
      return response.data.allVariety;
    } catch(err) {
      console.log(err);
      throw err;
    }
}

const getAllTypes = async() => {
  try {
    const response = await axios.get('http://localhost:5000/api/v1/getallingredient')
    console.log(response);
    return response.data.allIngredient
  }  catch(err) {
    console.log(err);
    throw err;
  }
}

const router = createBrowserRouter([
  {path:"/", element:<MainNavigation/>, children:[
    {path:"/authform", element:<AuthForm/>},
    {path:"/", element:<ProtectedRoute><Home/></ProtectedRoute>, loader:getAllVariety},
    {path:"/customize", element:<ProtectedRoute><CustomizePizza/></ProtectedRoute>},
    {path:"/orders", element:<ProtectedRoute><Orders/></ProtectedRoute>},
    {path:"/admin", element:<AdminRoute><AdminDashboard/></AdminRoute>}
  ]}
])

export default function App() {
  return (
    <RouterProvider router={router}>App</RouterProvider>
  )
}

