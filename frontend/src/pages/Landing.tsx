import { ArrowRight, BookOpen, Shield, Users, GraduationCap, CheckCircle2, Award, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen relative overflow-x-hidden selection:bg-primary/20">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full min-h-screen z-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-40" />
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px] mix-blend-screen opacity-30 animate-pulse" />
                <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[100px] mix-blend-screen opacity-30" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 lg:pt-44">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Academic Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:bg-white/10 transition-colors cursor-default">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-white/90">University Academic Portal</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        Campus Learning & Academic <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-300 to-white">
                            Management System
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        A centralized platform for students, faculty, and administration — manage course syllabi, assignments, auto-graded quizzes, and attendance in real time.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link to="/courses" className="btn btn-primary h-12 px-7 text-base w-full sm:w-auto">
                            Browse Courses
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                        <Link to="/login" className="btn btn-secondary h-12 px-7 text-base w-full sm:w-auto">
                            Sign In to Portal
                        </Link>
                    </div>
                </div>
            </section>

            {/* Core Academic Modules Highlight */}
            <div className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { value: "Student Portal", label: "Courses, Quizzes & Grades" },
                            { value: "Teacher Portal", label: "Grading & Attendance" },
                            { value: "Admin Console", label: "Batches & Allocations" },
                            { value: "Auto-Grading", label: "Instant MCQ Feedback" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-3">
                                <div className="text-xl md:text-2xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-xs md:text-sm font-medium text-text-secondary tracking-wide">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Features Grid */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Academic Capabilities</h2>
                        <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto">
                            Engineered for university departments, semester curriculums, and structured learning workflows.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BookOpen className="w-7 h-7 text-white" />,
                                title: "Structured Curriculum",
                                desc: "Sequential weekly lessons, downloadable lecture slides, and rich study materials organized by semester.",
                                color: "bg-blue-500/10"
                            },
                            {
                                icon: <Award className="w-7 h-7 text-white" />,
                                title: "Automated Quizzes & Gradebook",
                                desc: "Timed MCQs with instantaneous auto-grading, answer reviews, and comprehensive student gradebooks.",
                                color: "bg-purple-500/10"
                            },
                            {
                                icon: <Shield className="w-7 h-7 text-white" />,
                                title: "Role-Based Security",
                                desc: "Strict separation of concerns between Students, Instructors, and Academic Administrators (RBAC).",
                                color: "bg-emerald-500/10"
                            },
                            {
                                icon: <FileText className="w-7 h-7 text-white" />,
                                title: "Assignment Submissions",
                                desc: "Digital submission portals with due date policies, grading criteria, and teacher feedback.",
                                color: "bg-amber-500/10"
                            },
                            {
                                icon: <Users className="w-7 h-7 text-white" />,
                                title: "Attendance Tracking",
                                desc: "Date-wise attendance recording per section with percentage calculations and eligibility flags.",
                                color: "bg-indigo-500/10"
                            },
                            {
                                icon: <CheckCircle2 className="w-7 h-7 text-white" />,
                                title: "Academic Structure",
                                desc: "Support for Departments (BSCS, BSSE), batches, semester enrollments, and teacher course allocations.",
                                color: "bg-teal-500/10"
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors duration-200">
                                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Clean Final Call-to-Action */}
            <section className="py-20 px-6 text-center border-t border-white/5 bg-white/[0.01]">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Access Your Academic Portal</h2>
                    <p className="text-text-secondary mb-8 text-base">
                        Sign in with your student, faculty, or administrator credentials to get started.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login" className="btn btn-primary h-12 px-8 text-base w-full sm:w-auto">
                            Sign In to Portal
                        </Link>
                        <Link to="/courses" className="btn btn-secondary h-12 px-8 text-base w-full sm:w-auto">
                            Browse Courses
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
