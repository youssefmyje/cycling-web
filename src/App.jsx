import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ProgressPage from "./pages/ProgressPage";
import CommunityPage from "./pages/CommunityPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecommendationPage from "./pages/RecommendationPage";
import NewActivityPage from "./pages/NewActivityPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/progres" element={<ProgressPage />} />
          <Route path="/communaute" element={<CommunityPage />} />
          <Route path="/recommandation" element={<RecommendationPage />} />
          <Route path="/activites/nouvelle" element={<NewActivityPage />} />
          <Route path="/activites/:activityId" element={<ActivityDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
