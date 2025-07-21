import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import DataManagement from "./pages/DataManagement";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/user/:username" element={<UserProfile />} />
        <Route path="/user/:username/settings" element={<Settings />} />
        <Route path="/data" element={<DataManagement />} />
      </Routes>
    </Layout>
  );
}

export default App;
