import { ArrowRight, BookOpen, Shield, Users, Play, Star, CheckCircle, Sparkles } from 'lucide-react';
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
            <section className="relative pt-32 pb-32 px-6 lg:pt-48">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:bg-white/10 transition-colors cursor-default">
                        <Sparkles className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium text-white/90">LMS 2.0 is Live</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        The Future of Learning <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
                            is Here.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Empower your students with a platform designed for <span className="text-white font-medium">clarity</span>, <span className="text-white font-medium">focus</span>, and <span className="text-white font-medium">results</span>.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link to="/register" className="btn btn-premium h-14 px-8 text-lg w-full sm:w-auto">
                            Start Learning Free
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                        <button className="btn btn-secondary h-14 px-8 text-lg w-full sm:w-auto">
                            <Play className="w-5 h-5 mr-2" />
                            Watch Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Band */}
            <div className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                        {[
                            { value: "10K+", label: "Active Learners" },
                            { value: "500+", label: "Instructors" },
                            { value: "1M+", label: "Lessons Taken" },
                            { value: "4.9/5", label: "User Rating" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-text-secondary uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <section className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Why LMS.pro?</h2>
                        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                            Everything you need to manage your educational empire, without the clutter.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Shield className="w-8 h-8 text-white" />,
                                title: "Secure by Design",
                                desc: "Enterprise-grade encryption keeps your content and student data safe.",
                                color: "bg-blue-500/10"
                            },
                            {
                                icon: <BookOpen className="w-8 h-8 text-white" />,
                                title: "Interactive Courses",
                                desc: "Create engaging content with video, quizzes, and live assignments.",
                                color: "bg-purple-500/10"
                            },
                            {
                                icon: <Users className="w-8 h-8 text-white" />,
                                title: "Community First",
                                desc: "Built-in forums and chat keep your students connected and learning.",
                                color: "bg-emerald-500/10"
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors duration-300">
                                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial / Social Proof */}
            <section className="py-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="glass-premium rounded-3xl p-12 md:p-20 relative overflow-hidden">
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                        <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
                            <div>
                                <div className="flex gap-1 mb-6">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <blockquote className="text-3xl md:text-4xl font-medium leading-tight mb-8">
                                    "The clean interface and powerful analytics have completely changed how I manage my courses."
                                </blockquote>
                                <div>
                                    <div className="font-bold text-white text-lg">Sarah Johnson</div>
                                    <div className="text-text-secondary">Director of CS, TechUniversity</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-text-secondary uppercase tracking-widest text-sm mb-6">Everything included</h4>
                                {[
                                    "Unlimited Students",
                                    "Custom Domain Support",
                                    "Drip Content Schedule",
                                    "0% Transaction Fees",
                                    "24/7 Priority Support"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-lg">
                                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                                        <span className="text-white/90">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to get started?</h2>
                    <p className="text-xl text-text-secondary mb-10">
                        Join over 10,000 educators teaching on LMS.pro today.
                    </p>
                    <Link to="/register" className="btn btn-premium h-14 px-10 text-lg">
                        Create Your Account
                    </Link>
                    <p className="mt-6 text-sm text-text-secondary">
                        No credit card required. Cancel anytime.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Landing;
