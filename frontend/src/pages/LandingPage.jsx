import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBrain, FaSearch, FaComments, FaQuoteRight, 
  FaLayerGroup, FaShieldAlt, FaUpload, FaCogs, 
  FaLightbulb, FaArrowRight, FaReact, FaPython, 
  FaDatabase 
} from 'react-icons/fa';
import { SiFastapi, SiPostgresql } from 'react-icons/si';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxwYXRoIGQ9Ik01OSAwSDBWMzBoNjB6IiBmaWxsPSIjZjhmOWZhIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 dark:opacity-5"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600 dark:from-indigo-400 dark:to-emerald-400">
            Understand Research Papers Faster with AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
            Upload papers, generate intelligent summaries, search semantically, and ask questions using an AI-powered RAG research assistant.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2">
              Get Started <FaArrowRight />
            </Link>
            <a href="#features" className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-400 text-gray-800 dark:text-white rounded-lg font-semibold text-lg transition-colors flex items-center justify-center">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Powerful Features for Researchers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FaBrain className="text-4xl text-indigo-500" />}
              title="AI Paper Summarization"
              description="Extract key findings, methodology, and conclusions instantly without reading the entire document."
            />
            <FeatureCard 
              icon={<FaSearch className="text-4xl text-emerald-500" />}
              title="Semantic Search"
              description="Find exact concepts and ideas across your entire library using meaning, not just keywords."
            />
            <FeatureCard 
              icon={<FaComments className="text-4xl text-blue-500" />}
              title="Chat With Papers"
              description="Have a conversation with your documents. Ask complex questions and get detailed, contextual answers."
            />
            <FeatureCard 
              icon={<FaQuoteRight className="text-4xl text-purple-500" />}
              title="Citation-Aware Answers"
              description="Every claim is backed by a specific citation, linking you directly to the source text in the PDF."
            />
            <FeatureCard 
              icon={<FaLayerGroup className="text-4xl text-pink-500" />}
              title="Multi-Paper Analysis"
              description="Compare and contrast methodologies and results across multiple papers simultaneously."
            />
            <FeatureCard 
              icon={<FaShieldAlt className="text-4xl text-orange-500" />}
              title="Secure Research Workspace"
              description="Your papers and research data are stored securely and privately in your personal workspace."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2"></div>
            
            <Step number="1" icon={<FaUpload />} title="Upload" desc="Add your PDFs" />
            <Step number="2" icon={<FaCogs />} title="Process" desc="AI extracts text & layout" />
            <Step number="3" icon={<FaSearch />} title="Search" desc="Find relevant info" />
            <Step number="4" icon={<FaComments />} title="Ask" desc="Chat with documents" />
            <Step number="5" icon={<FaLightbulb />} title="Discover" desc="Get new insights" />
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Powered by Cutting-Edge Tech</h2>
          
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
            <TechBadge icon={<FaReact className="text-[#61DAFB]" />} name="React.js" role="Frontend UI" />
            <TechBadge icon={<SiFastapi className="text-[#009688]" />} name="FastAPI" role="Backend API" />
            <TechBadge icon={<FaPython className="text-[#3776AB]" />} name="Python" role="Processing" />
            <TechBadge icon={<FaBrain className="text-[#FFD21E]" />} name="Hugging Face" role="Embeddings & LLM" />
            <TechBadge icon={<FaDatabase className="text-[#326CE5]" />} name="ChromaDB" role="Vector Store" />
            <TechBadge icon={<SiPostgresql className="text-[#336791]" />} name="PostgreSQL" role="Relational DB" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 text-center bg-indigo-600 text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Ready to accelerate your research?</h2>
          <p className="text-xl mb-10 text-indigo-100 max-w-2xl mx-auto">Join thousands of researchers who are saving time and discovering deeper insights.</p>
          <Link to="/register" className="inline-block px-10 py-4 bg-white text-indigo-600 rounded-lg font-bold text-xl transition-transform hover:scale-105 shadow-xl">
            Get Started For Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold text-white flex items-center gap-2 mb-4 md:mb-0">
              <FaBrain className="text-indigo-500" /> ResearchAI
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} ResearchAI Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="mb-6 inline-block p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const Step = ({ number, icon, title, desc }) => (
  <div className="flex flex-col items-center mb-8 md:mb-0 relative bg-white dark:bg-gray-900 p-4 rounded-xl">
    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl mb-4 border-4 border-white dark:border-gray-900 z-10 relative">
      <span className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
        {number}
      </span>
      {icon}
    </div>
    <h4 className="font-bold text-lg mb-1">{title}</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{desc}</p>
  </div>
);

const TechBadge = ({ icon, name, role }) => (
  <div className="flex flex-col items-center">
    <div className="text-5xl mb-3 grayscale hover:grayscale-0 transition-all duration-300">
      {icon}
    </div>
    <h5 className="font-bold text-gray-800 dark:text-gray-200">{name}</h5>
    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1">{role}</span>
  </div>
);

export default LandingPage;
