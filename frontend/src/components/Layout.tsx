import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen relative overflow-hidden bg-bg-primary text-text-primary font-sans selection:bg-primary/30 selection:text-white">
            {/* Global Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-secondary/10 blur-[100px] rounded-full mix-blend-screen animate-pulse delay-1000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse delay-2000" />
            </div>

            <Navbar />
            <main className="flex-grow pt-20 relative z-10"> {/* Add padding top to account for fixed navbar */}
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
