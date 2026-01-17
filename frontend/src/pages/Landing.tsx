import { ArrowRight, BookOpen, Shield, Users, Play, Star, CheckCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[800px] gradient-mesh opacity-20 z-0" />


            {/* Hero Section */}
            <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    {/* Badge with Pulse */}
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-premium mb-8 text-sm font-semibold hover-glow border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary glow-primary"></span>
                        </span>
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="gradient-text font-bold">V 2.0 Now Live</span>
                        <div className="w-px h-4 bg-gradient-to-b from-transparent via-white/40 to-transparent mx-2" />
                        <span className="text-text-secondary">Experience the Future</span>
                    </div>

                    {/* Main Headline with Gradient Animation */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        The Digital Campus <br />
                        <span className="gradient-text text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
                            Reimagined for You.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-2xl text-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light">
                        Join thousands of students and educators in a seamless learning environment.
                        Experience the future of education with tools designed for <span className="text-primary font-semibold">growth</span>, <span className="text-secondary font-semibold">collaboration</span>, and <span className="text-accent-success font-semibold">success</span>.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link to="/register" className="btn btn-premium text-lg px-10 py-5 rounded-xl hover:scale-105 transition-all duration-300 shadow-2xl shadow-primary/30 group">
                            <span className="relative z-10">Start Learning Now</span>
                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="btn btn-secondary text-lg px-10 py-5 rounded-xl hover:scale-105 transition-all duration-300 glass-premium border border-white/20 hover:border-white/40 group">
                            <Play className="w-5 h-5 mr-2 fill-current group-hover:scale-110 transition-transform" />
                            <span>Watch Demo</span>
                        </button>
                    </div>

                    {/* Animated Stats */}
                    <div className="mt-24 pt-12 border-t border-white/10 flex flex-wrap justify-center gap-x-16 gap-y-10 animate-in fade-in zoom-in-95 duration-1000 delay-500">
                        {[
                            { value: "10K+", label: "Active Students", color: "primary" },
                            { value: "500+", label: "Expert Instructors", color: "secondary" },
                            { value: "98%", label: "Satisfaction Rate", color: "accent-success" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center group cursor-pointer hover-glow rounded-2xl p-6 transition-all duration-300">
                                <div className="text-4xl md:text-5xl font-black gradient-text mb-2 stat-number">{stat.value}</div>
                                <div className="text-sm md:text-base text-text-secondary font-medium tracking-wide">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black mb-6">
                            Why Choose <span className="gradient-text">LMS.pro</span>?
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto text-lg md:text-xl font-light">
                            We provide everything you need to create, manage, and scale your educational content with cutting-edge technology.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 perspective">
                        {[
                            {
                                icon: <Shield className="w-10 h-10 text-secondary" />,
                                title: "Enterprise Security",
                                desc: "Bank-grade encryption and role-based access control to keep your data safe and secure.",
                                gradient: "from-pink-500/10 to-rose-500/10"
                            },
                            {
                                icon: <BookOpen className="w-10 h-10 text-primary" />,
                                title: "Interactive Learning",
                                desc: "Engage students with HD video, real-time quizzes, and gamified progress tracking.",
                                gradient: "from-indigo-500/10 to-purple-500/10"
                            },
                            {
                                icon: <Users className="w-10 h-10 text-accent-success" />,
                                title: "Community Driven",
                                desc: "Built-in discussion forums and peer-to-peer messaging to foster collaboration.",
                                gradient: "from-emerald-500/10 to-teal-500/10"
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="card-premium card-3d border-gradient group cursor-pointer stagger-${idx + 1}">
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />
                                <div className="relative z-10">
                                    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 w-fit group-hover:scale-110 transition-all duration-500 ring-2 ring-white/10 group-hover:ring-primary/50 icon-bounce backdrop-blur-sm">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 group-hover:gradient-text transition-all duration-300">{feature.title}</h3>
                                    <p className="text-text-secondary leading-relaxed text-base">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial / Trust Section */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-3 text-primary font-bold text-sm tracking-wider">
                            <Star className="w-6 h-6 fill-primary animate-pulse" /> TRUSTED BY EXPERTS
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black leading-tight">
                            "The most <span className="gradient-text">intuitive LMS</span> we've ever used."
                        </h2>
                        <div className="glass-premium p-10 rounded-3xl relative float hover:shadow-2xl transition-all duration-500 border border-white/20">
                            <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-secondary/20 rounded-full blur-2xl" />
                            <p className="text-lg md:text-xl text-text-secondary italic mb-8 leading-relaxed relative z-10">
                                "Switching to LMS.pro transformed how we deliver content. The engagement from students has doubled, and the administrative tools are a lifesaver."
                            </p>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/30">
                                    JD
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg">Jane Doe</div>
                                    <div className="text-sm text-text-secondary">Director of Education, EduTech Inc.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {[
                            "Unlimited Course Creation",
                            "Advanced Analytics Dashboard",
                            "Mobile-First Responsive Design",
                            "24/7 Priority Support",
                            "Custom Certificate Generation"
                        ].map((item, i) => (
                            <div key={i} className={`flex items-center gap-5 p-5 rounded-2xl glass hover:glass-premium transition-all duration-300 border border-white/5 hover:border-primary/30 group cursor-pointer stagger-${i + 1}`}>
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent-success/20 to-accent-success/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <CheckCircle className="w-7 h-7 text-accent-success" />
                                </div>
                                <span className="text-lg font-semibold group-hover:text-primary transition-colors">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 relative">
                <div className="max-w-6xl mx-auto text-center relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full pointer-events-none glow-primary" />
                    <div className="relative z-10 glass-premium p-16 md:p-24 rounded-[2rem] border-2 border-white/20 hover:border-white/30 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-[2rem]" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                                Ready to <span className="gradient-text">Transform Education</span>?
                            </h2>
                            <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                                Join the fastest growing learning platform today. No credit card required.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                <Link to="/register" className="btn btn-premium text-lg px-12 py-6 rounded-xl shadow-2xl hover:scale-105 transition-all duration-300">
                                    Get Started for Free
                                </Link>
                                <Link to="/about" className="btn btn-secondary text-lg px-12 py-6 rounded-xl glass-premium border border-white/20 hover:border-white/40 hover:scale-105 transition-all duration-300">
                                    Contact Sales
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
