import { Outlet } from 'react-router-dom';
import TeacherNav from '../components/TeacherNav';

const TeacherLayout = () => {
    return (
        <>
            <TeacherNav />
            <Outlet />
        </>
    );
};

export default TeacherLayout;
