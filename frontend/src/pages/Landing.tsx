import { ArrowRight, BookOpen, Shield, Users, Play, Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 px-6">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm font-medium text-primary-hover animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span>V 2.0 Now Live</span>
                        <div className="w-px h-3 bg-white/20 mx-1" />
                        <span className="text-text-secondary">Explore the new features</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        The Digital Campus <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
                            Reimagined for You.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Join thousands of students and educators in a seamless learning environment.
                        Experience the future of education with tools designed for growth, collaboration, and success.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link to="/register" className="btn btn-primary text-lg px-8 py-4 h-auto shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                            Start Learning Now <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button className="btn btn-secondary text-lg px-8 py-4 h-auto hover:bg-white/10 hover:scale-105 transition-transform group">
                            <Play className="w-5 h-5 mr-2 fill-current group-hover:scale-110 transition-transform" /> Watch Demo
                        </button>
                    </div>

                    {/* Stats / Social Proof */}
                    <div className="mt-20 pt-10 border-t border-white/5 flex flex-wrap justify-center gap-x-12 gap-y-8 animate-in fade-in zoom-in-95 duration-1000 delay-500">
                        {[
                            { value: "10K+", label: "Active Students" },
                            { value: "500+", label: "Expert Instructors" },
                            { value: "98%", label: "Satisfaction Rate" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-text-secondary">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 relative bg-bg-secondary/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Choose LMS<span className="text-primary">.pro</span>?</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto text-lg">
                            We provide everything you need to create, manage, and scale your educational content.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Shield className="w-8 h-8 text-secondary" />,
                                title: "Enterprise Security",
                                desc: "Bank-grade encryption and role-based access control to keep your data safe."
                            },
                            {
                                icon: <BookOpen className="w-8 h-8 text-primary" />,
                                title: "Interactive Learning",
                                desc: "Engage students with HD video, real-time quizzes, and gamified progress tracking."
                            },
                            {
                                icon: <Users className="w-8 h-8 text-accent-success" />,
                                title: "Community Driven",
                                desc: "Built-in discussion forums and peer-to-peer messaging to foster collaboration."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="card group hover:bg-bg-card/80 p-8 border border-white/5 hover:border-primary/20">
                                <div className="mb-6 p-4 rounded-xl bg-gray-800/50 w-fit group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10 group-hover:ring-primary/50">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial / Trust Section */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 text-primary font-bold mb-4">
                            <Star className="w-5 h-5 fill-primary" /> TRUSTED BY EXPERTS
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                            "The most intuitive LMS we've ever used."
                        </h2>
                        <div className="glass p-8 rounded-2xl relative">
                            <p className="text-lg text-text-secondary italic mb-6">
                                "Switching to LMS.pro transformed how we deliver content. The engagement from students has doubled, and the administrative tools are a lifesaver."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                                    JD
                                </div>
                                <div>
                                    <div className="font-bold text-white">Jane Doe</div>
                                    <div className="text-sm text-text-secondary">Director of Education, EduTech Inc.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {[
                            "Unlimited Course Creation",
                            "Advanced Analytics Dashboard",
                            "Mobile-First Responsive Design",
                            "24/7 Priority Support",
                            "Custom Certificate Generation"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <CheckCircle className="w-6 h-6 text-accent-success flex-shrink-0" />
                                <span className="text-lg font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 relative">
                <div className="max-w-5xl mx-auto text-center relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative z-10 glass p-12 md:p-20 rounded-3xl border border-white/10">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Education?</h2>
                        <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
                            Join the fastest growing learning platform today. No credit card required.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/register" className="btn btn-primary text-lg px-10 py-4 shadow-xl">
                                Get Started for Free
                            </Link>
                            <Link to="/about" className="btn btn-secondary text-lg px-10 py-4">
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
