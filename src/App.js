import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PostItemPage from './pages/PostItemPage';
import PostDetailPage from './components/PostDetailPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import CommunityFeed from './pages/CommunityFeed';
import MyPostsPage from './pages/MyPostsPage';
import EditPostPage from './pages/EditPostPage';
import MessagesPage from './components/MessagesPage'; // Add this import
import PersistentPostsAccess from './components/PersistentPostsAccess';

// ScrollToTop component
function ScrollToTop() {
  const { pathname } = useLocation();
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Add ScrollToTop component */}
        <ScrollToTop />
        
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/post" element={<PostItemPage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/communityfeed" element={<CommunityFeed />} />
            <Route path="/item/:id" element={<ItemDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-posts" element={<MyPostsPage />} />
            <Route path="/post/edit/:postId" element={<EditPostPage />} />
            <Route path="/messages" element={<MessagesPage />} /> {/* Add this route */}
          </Routes>
        </main>
        <Footer />
        <PersistentPostsAccess />
      </div>
    </Router>
  );
}

export default App;