"use client";

import { useLangStore } from "@/store/langStore";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CreditCard,
  Globe,
  PiggyBank,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { t, lang, setLang } = useLangStore();

  const features = [
    {
      icon: Wallet,
      titleKey: "landing.feature1Title",
      descKey: "landing.feature1Desc",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Building2,
      titleKey: "landing.feature2Title",
      descKey: "landing.feature2Desc",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: BarChart3,
      titleKey: "landing.feature3Title",
      descKey: "landing.feature3Desc",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: PiggyBank,
      titleKey: "landing.feature4Title",
      descKey: "landing.feature4Desc",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: TrendingUp,
      titleKey: "landing.feature5Title",
      descKey: "landing.feature5Desc",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: CreditCard,
      titleKey: "landing.feature6Title",
      descKey: "landing.feature6Desc",
      color: "bg-rose-50 text-rose-600",
    },
  ];

  const whoIsItFor = [
    {
      icon: Users,
      titleKey: "landing.audience1Title",
      descKey: "landing.audience1Desc",
    },
    {
      icon: Building2,
      titleKey: "landing.audience2Title",
      descKey: "landing.audience2Desc",
    },
    {
      icon: TrendingUp,
      titleKey: "landing.audience3Title",
      descKey: "landing.audience3Desc",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FinSync</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setLang(lang === "en" ? "am" : "en")}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <Globe className="h-4 w-4 mr-1" />
                {lang === "en" ? "EN" : "አማ"}
              </button>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                {t("landing.navLogin")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-sm mb-6">
              <Shield className="h-4 w-4 mr-2" />
              {t("landing.heroBadge")}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              {t("landing.heroTitle")}{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {t("landing.heroTitleHighlight")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t("landing.heroSubtitle")}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
            >
              {t("landing.ctaSignIn")} <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <div className="mt-12 flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Smartphone className="h-4 w-4" />
              <span>{t("landing.heroNote")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("landing.featuresSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all group"
              >
                <div
                  className={`inline-flex p-3 rounded-lg ${feature.color} mb-5`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("landing.howItWorksTitle")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("landing.howItWorksSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                titleKey: "landing.step1Title",
                descKey: "landing.step1Desc",
              },
              {
                step: "02",
                titleKey: "landing.step2Title",
                descKey: "landing.step2Desc",
              },
              {
                step: "03",
                titleKey: "landing.step3Title",
                descKey: "landing.step3Desc",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 text-2xl font-bold mb-6">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t(s.titleKey)}
                </h3>
                <p className="text-gray-600">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("landing.whoForTitle")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("landing.whoForSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {whoIsItFor.map((aud) => (
              <div
                key={aud.titleKey}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 mb-5">
                  <aud.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t(aud.titleKey)}
                </h3>
                <p className="text-gray-600">{t(aud.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t("landing.finalCtaTitle")}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t("landing.finalCtaSubtitle")}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
          >
            {t("landing.ctaSignIn")} <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">FinSync</span>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} FinSync. {t("landing.footer")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
