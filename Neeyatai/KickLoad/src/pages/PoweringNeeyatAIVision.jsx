// src/pages/PoweringNeeyatAIVision.jsx
import {
    FaUserShield,
    FaCogs,
    FaChartBar,
    FaRocket,
    FaLightbulb,
    FaCheckCircle,
} from "react-icons/fa";

export default function PoweringNeeyatAIVision() {
    return (
        <article className="max-w-4xl mx-auto px-6 py-12 bg-gray-50 rounded-2xl shadow-xl border border-gray-200 font-sans text-gray-900">
            <div className="ml-5 mr-5">
                {/* Brand Hero */}
                <header className="mb-10 text-center">
                    <img
                        src="/KickLoad.png"
                        alt="KickLoad"
                        className="mx-auto mt-[-20px] rounded-full shadow-lg border-4 border-zinc-500 bg-white object-contain w-40 h-40
            transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
                    />
                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-blue-900 uppercase">
                        Powering Neeyat AI’s Vision
                    </h1>
                    <div className="text-gray-500 text-base mt-2 tracking-wide">KICKLOAD: THE SCALABLE COMPANION</div>
                    <div className="my-4 bg-blue-100 h-1 w-24 mx-auto rounded" />
                </header>

                {/* Beyond Testing, Towards Trust */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold tracking-wide text-blue-900 border-l-4 border-blue-700 pl-4 py-2 mb-4 flex items-center gap-2">
                        <FaUserShield className="text-emerald-600" size={26} /> Beyond Testing, Towards Trust
                    </h2>
                    <div className="flex flex-wrap gap-6 mb-4">
                        <img
                            src="/images/kickloadcompanion.jpg"
                            alt="KickLoad Companion"
                            className="w-68 h-48 object-cover rounded-lg shadow-lg border border-blue-100
              transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-[250px]">
                            <p className="mb-3 text-lg">
                                In a world where every <span className="font-semibold">millisecond counts</span> and every user expects flawless digital experiences, traditional load testing falls short. Most tools measure—but they don’t guide.
                            </p>
                            <p className="text-base text-gray-700">
                                At Neeyat AI, we believe technology should not just solve today’s problems but anticipate tomorrow’s demands.
                                KickLoad is more than just our load testing tool—it is a companion, built to align with our vision of making performance engineering intelligent, adaptive, and deeply human-centric.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="my-10 bg-blue-50 h-1 w-20 mx-auto rounded" />

                {/* Why KickLoad Exists */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold tracking-wide text-blue-900 border-l-4 border-blue-700 pl-4 py-2 mb-4 flex items-center gap-2">
                        <FaCogs className="text-blue-600" size={26} /> Why KickLoad Exists?
                    </h2>
                    <p className="mb-3 text-lg leading-relaxed">
                        Most load-testing platforms give numbers. They’ll tell you <span className="font-semibold text-blue-700 mx-1">latency</span>, <span className="font-semibold text-blue-700 mx-1">throughput</span>, and <span className="font-semibold text-blue-700 mx-1">error rates</span>. Useful? Sure. Actionable? Rarely.
                    </p>
                    <blockquote className="mb-4 pl-6 border-l-4 border-blue-300 italic text-blue-800 text-base">
                        KickLoad flips this on its head. It doesn’t just show you stress points—it explains them.
                    </blockquote>
                    <ul className="mb-4 pl-7 list-none space-y-3">
                        <li className="flex items-start gap-2">
                            <FaCheckCircle className="mt-1 text-blue-500" size={18} />
                            <span>Why did your API choke at 10,000 concurrent users?</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <FaCheckCircle className="mt-1 text-blue-500" size={18} />
                            <span>Where are the hidden bottlenecks slowing you down?</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <FaCheckCircle className="mt-1 text-blue-500" size={18} />
                            <span>How can you fix performance issues without over-provisioning cloud resources?</span>
                        </li>
                    </ul>
                    <p className="text-base text-gray-700">
                        This aligns directly with Neeyat AI’s vision: technology that <span className="italic">interprets, explains, and empowers</span>.
                    </p>
                </section>

                <div className="my-10 bg-blue-50 h-1 w-20 mx-auto rounded" />

                {/* KickLoad New Companion */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold tracking-wide text-blue-900 border-l-4 border-blue-700 pl-4 py-2 mb-6 flex items-center gap-2">
                        <FaRocket className="text-indigo-500" size={24} /> New Companion
                    </h2>
                    <div className="mb-4 flex flex-wrap">
                        <img
                            src="/images/kickloadvision.jpg"
                            alt="KickLoad Companion"
                            className="w-68 h-48 object-cover rounded-lg shadow-lg border border-blue-100
        transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex-shrink-0 mr-6 mb-4"
                        />
                        <div className="flex-1 min-w-[250px]">
                            <p className="mb-3 text-lg">
                                Most tools are <span className="italic">reactive</span>. <span className="font-semibold text-emerald-700">KickLoad</span> is proactive. Think of it as that trusted teammate who:
                            </p>
                            <ul className="pl-7 list-none space-y-3 mb-4">
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="mt-1 text-emerald-600" size={18} />
                                    <span>Prepares you for scale before you even need it.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="mt-1 text-emerald-600" size={18} />
                                    <span>Adapts scenarios dynamically to mimic real-world unpredictability.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="mt-1 text-emerald-600" size={18} />
                                    <span>Learns from past tests so you don’t repeat the same blind spots.</span>
                                </li>
                            </ul>
                            <p className="mb-3">
                                It’s not here to “replace testers” but to elevate them — giving engineering teams confidence that their systems can handle growth, unpredictability, and spikes without breaking.
                            </p>
                        </div>
                    </div>
                </section>


                <div className="my-10 bg-blue-50 h-1 w-20 mx-auto rounded" />

                {/* Features That Define KickLoad’s DNA */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold tracking-wide text-blue-900 border-l-4 border-blue-700 pl-4 py-2 mb-4 flex items-center gap-2">
                        <FaChartBar className="text-purple-600" size={26} /> Features That Define KickLoad's DNA
                    </h2>

                    <div className="flex flex-wrap gap-6 mb-6">
                        <img
                            src="/images/kickloaddna.jpg"
                            alt="KickLoad DNA"
                            className="w-68 h-48 object-cover rounded-lg shadow-lg border border-purple-100
              transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-[250px] text-lg font-medium mb-1">
                            Direct reflection of Neeyat AI values is: KickLoad
                            <h2 className="mt-2 font-semibold">KickLoad wasn’t built in isolation. It’s a direct reflection of Neeyat AI’s values: precision, adaptability, and accessibility</h2>
                        </div>
                    </div>

                    <ul className="grid md:grid-cols-2 gap-6">
                        <li className="flex items-start gap-3 p-4 rounded-xl bg-white shadow border
            transition duration-300 hover:bg-blue-50 hover:scale-105">
                            <FaLightbulb className="text-yellow-400" size={22} />
                            <div>
                                <div className="font-semibold text-blue-700">Adaptive Scenario Modeling</div>
                                <div className="text-gray-700">Real-world traffic isn’t linear. KickLoad simulates chaos the way actual users create it.</div>
                            </div>
                        </li>
                        <li className="flex items-start gap-3 p-4 rounded-xl bg-white shadow border
            transition duration-300 hover:bg-blue-50 hover:scale-105">
                            <FaRocket className="text-blue-400" size={22} />
                            <div>
                                <div className="font-semibold text-blue-700">Cloud-Native Scalability</div>
                                <div className="text-gray-700">From 1,000 to 1,000,000 concurrent users—KickLoad scales with you, instantly.</div>
                            </div>
                        </li>
                        <li className="flex items-start gap-3 p-4 rounded-xl bg-white shadow border
            transition duration-300 hover:bg-blue-50 hover:scale-105">
                            <FaChartBar className="text-green-500" size={22} />
                            <div>
                                <div className="font-semibold text-blue-700">Actionable Insights, Not Just Data</div>
                                <div className="text-gray-700">Performance graphs are nice, but KickLoad highlights exactly what needs fixing.</div>
                            </div>
                        </li>
                        <li className="flex items-start gap-3 p-4 rounded-xl bg-white shadow border
            transition duration-300 hover:bg-blue-50 hover:scale-105">
                            <FaCogs className="text-gray-500" size={22} />
                            <div>
                                <div className="font-semibold text-blue-700">Developer-First Design</div>
                                <div className="text-gray-700">Lightweight CLI, intuitive dashboards, and integrations with CI/CD pipelines mean KickLoad fits into workflows, not the other way around.</div>
                            </div>
                        </li>
                        <li className="flex items-start gap-3 p-4 rounded-xl bg-white shadow border md:col-span-2
            transition duration-300 hover:bg-blue-50 hover:scale-105">
                            <FaCheckCircle className="text-emerald-400" size={22} />
                            <div>
                                <div className="font-semibold text-blue-700">AI-Enhanced Recommendations</div>
                                <div className="text-gray-700">KickLoad doesn’t just show outcomes; it suggests optimizations tailored to your stack.</div>
                            </div>
                        </li>
                    </ul>
                </section>

                <div className="my-12 bg-blue-50 h-1 w-20 mx-auto rounded" />

                {/* Vision & Statement */}
                <section className="mb-8">
                    <h3 className="text-xl font-semibold text-blue-900 border-l-4 border-blue-800 pl-4 mb-4">The Neeyat AI Vision in Action</h3>
                    <p className="mb-4 text-lg italic text-blue-900">
                        At Neeyat AI, our north star is simple: make technology partners in decision-making, not just silent executors.
                        KickLoad embodies this philosophy by bridging the gap between performance testing and performance strategy.
                    </p>
                    <p className="mb-14 text-base font-semibold text-gray-900">
                        It’s not about load testing anymore—it’s about <span className="text-blue-700 font-bold">performance assurance</span>. With KickLoad, we’re building not just a faster digital future, but a more reliable one.
                    </p>
                    <h3 className="text-xl font-semibold text-blue-900 border-l-4 border-blue-800 pl-4 mb-4">From Insight to Action</h3>
                    <p className="mb-4 text-base text-gray-900">
                        A tool that only shows you problems isn’t enough. KickLoad ensures you walk away with clear answers and actionable fixes. That’s where it transforms from a testing utility into a strategic companion for growth.
                    </p>
                    <p className="mb-2 font-medium text-gray-800">
                        For us at Neeyat AI, KickLoad isn’t just software—it’s a commitment to reliability, scalability, and human-centered design.
                    </p>


                </section>
                {/* Epilogue Section at Bottom */}
                <div className="mt-30 flex justify-center mb-8">
                    <img
                        src="/images/neeyatai.png"
                        alt="Neeyat AI Logo"
                        className="rounded-full shadow-lg border-4 border-amber-50 bg-white object-contain w-40 h-40
      transition duration-300 hover:scale-105 hover:shadow-2xl"
                    />
                </div>
                <blockquote className="mx-auto max-w-xl text-center mb-10 italic text-gray-700 dark:text-gray-300 text-lg leading-relaxed tracking-wide opacity-90">
                    <p className="mb-4">
                        “KickLoad isn’t just a step in our product line. It’s a statement of intent.”
                    </p>
                    <p>
                        — A reflection of Neeyat AI’s vision: scalable, adaptive, and relentlessly human.
                    </p>
                </blockquote>
                <div className="text-center mt-6 mb-[-30px] text-xs text-blue-900 tracking-wide font-bold">
                    www.neeyatai.com
                </div>
            </div>
        </article>
    );
}
