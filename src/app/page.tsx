
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/components/../lib/constants';
import { ArrowRight, LogIn, Loader2, Wand2, ListTree, Users, LayoutGrid, Save, History, FileOutput, FileInput, Briefcase, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <Card className="bg-gray-800/50 backdrop-blur-sm shadow-lg hover:shadow-primary/20 hover:border-primary/30 border border-transparent transition-all duration-300 h-full">
    <CardHeader className="pb-4">
      <div className="bg-gray-900/60 border border-ai-glow/30 text-ai-glow p-3 rounded-full w-fit mb-3">
        <Icon className="h-7 w-7" />
      </div>
      <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-400">{description}</p>
    </CardContent>
  </Card>
);

export default function HomePage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section 
        className="relative py-20 sm:py-28 px-4 text-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landing_pgbck.png')" }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div className="container mx-auto relative z-10">
            <Image
              src="/logo.png"
              alt="PlotForm Ai Production Planner Logo"
              width={128}
              height={128}
              className="mx-auto mb-4 rounded-2xl shadow-xl animate-pulse"
              data-ai-hint="app logo"
              priority
            />
            <h2 className="font-motley text-4xl sm:text-5xl font-bold text-white mb-4 relative inline-block pb-3 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[3px] after:bg-primary/70">
              <span className="text-stroke-black">
                <span className="special-p">P</span>lot<span className="special-f">F</span>orm: Ai Production Planner
              </span>
            </h2>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white text-shadow-md">
            The Ultimate Production Tool for <br className="hidden sm:block" />
            <span className="text-primary text-shadow-glow">Content Creators</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mt-4 text-slate-200 font-medium max-w-3xl mx-auto text-shadow">
            Go from a single idea to a fully structured, production-ready plan for your podcast, YouTube series, music album, and more.
          </p>
          <p className="mt-6 text-lg font-semibold text-slate-300 text-shadow">If it's Planned, it's Done. 🤝🎬</p>

          <div className="mt-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : user ? (
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-7 shadow-xl transform hover:scale-105 transition-transform duration-300 animate-button-glow">
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2.5 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-7 shadow-xl transform hover:scale-105 transition-transform duration-300">
                    <Link href="/signup">
                      Get Started For Free <ArrowRight className="ml-2.5 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-10 py-7 shadow-xl transform hover:scale-105 transition-transform duration-300 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                    <Link href="/login">
                      <LogIn className="mr-2 h-5 w-5" /> Login
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-900 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white">Why PlotForm is Your Unfair Advantage</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Built for serious creators who need structure and speed. We integrate powerful AI directly into your workflow, turning chaotic ideas into organized, actionable plans.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={Wand2}
              title="AI Co-Creator"
              description="Instantly generate complete, multi-part plans from a single idea. Then, use the integrated 'AI Polish' tool to refine and expand your own notes, turning rough drafts into finished scripts."
            />
            <FeatureCard
              icon={LayoutGrid}
              title="Adaptive Workspaces"
              description="Choose from over 20 project types. Whether you're making a 'Podcast' or a 'Novel', the app adapts its terminology, workflow, and default structures to match your creative endeavor perfectly."
            />
            <FeatureCard
              icon={Briefcase}
              title="Team Collaboration"
              description="Create shared Team Workspaces to manage projects with your collaborators. Assign roles, work from a shared dashboard, and keep everyone on the same page."
            />
            <FeatureCard
              icon={Users}
              title="Planner Pals & Community"
              description="Connect with other creators as 'Planner Pals' to see their public activity feed and stay motivated. Share your progress and get inspired by your peers."
            />
             <FeatureCard
              icon={BarChart3}
              title="Personal Analytics"
              description="Gain data-driven insights into your own creative process. Track your most productive days and discover your average time from initial idea to a published project."
            />
            <FeatureCard
              icon={History}
              title="Automatic Version History"
              description="Never lose a good idea. The app automatically saves a version of your work every time you save, allowing you to review and revert to previous states with confidence."
            />
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t border-gray-800 bg-gray-900">
        <p>© 2025 PlotForm. All rights reserved.</p>
      </footer>
    </div>
  );
}
