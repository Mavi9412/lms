import { ArrowRight, BookOpen, Shield, Users } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-20 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm font-medium text-primary-hover">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Next Generation Learning
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200" style={{ lineHeight: 1.1 }}>
                        The Digital Campus <br />
                        <span className="text-primary">Reimagined.</span>
                    </h1>

                    <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12">
                        Experience a seamless learning environment where administrators, teachers, and students connect, collaborate, and grow.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="btn btn-primary text-lg px-8">
                            Get Started <ArrowRight className="w-5 h-5" />
                        </button>
                        <button className="btn btn-secondary text-lg px-8">
                            View Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Shield className="w-8 h-8 text-secondary" />,
                            title: "Secure & Robust",
                            desc: "Enterprise-grade security with role-based access control and encrypted user data."
                        },
                        {
                            icon: <BookOpen className="w-8 h-8 text-primary" />,
                            title: "Interactive Learning",
                            desc: "Engage with video lectures, quizzes, and real-time feedback mechanisms."
                        },
                        {
                            icon: <Users className="w-8 h-8 text-accent-success" />,
                            title: "Seamless Collaboration",
                            desc: "Connect instantly with teachers and peers through integrated communication tools."
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className="card group">
                            <div className="mb-6 p-4 rounded-xl bg-gray-800/50 w-fit group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-text-secondary leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Landing;
