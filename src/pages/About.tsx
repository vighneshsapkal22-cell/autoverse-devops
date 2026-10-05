import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Users, Heart, Target, Eye, ArrowRight } from 'lucide-react';

export default function About() {
  const values = [
    { icon: ShieldCheck, title: 'Integrity', desc: 'We believe in complete transparency. No hidden fees, no surprises — just honest deals.' },
    { icon: Award, title: 'Excellence', desc: 'Every vehicle meets our rigorous standards before it reaches our showroom floor.' },
    { icon: Heart, title: 'Customer First', desc: 'Your satisfaction drives everything we do, from browsing to after-sales support.' },
    { icon: Target, title: 'Precision', desc: 'We match the right car to the right driver, every single time.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20">
      {/* Hero */}
      <section className="relative py-16 lg:py-24 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Dealership"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-900/50" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">About AutoVerse</h1>
          <p className="text-lg text-slate-300 mt-4 max-w-2xl mx-auto">
            For over a decade, we've been connecting drivers with vehicles they love. Our mission is simple: make car buying trustworthy, transparent, and enjoyable.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4">
                Our Story
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                A decade of trusted automotive excellence
              </h2>
              <p className="text-slate-600 mt-4 leading-relaxed">
                Founded in 2015, AutoVerse started as a small family-run dealership with a big vision: to transform the car buying experience into something people actually enjoy. We saw an industry plagued by hidden fees and pushy sales tactics, and we knew there was a better way.
              </p>
              <p className="text-slate-600 mt-4 leading-relaxed">
                Today, we're proud to be one of the region's most trusted dealerships, with thousands of happy customers and a reputation for honesty that we work hard to maintain every single day.
              </p>
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div>
                  <p className="text-3xl font-bold text-blue-600">5K+</p>
                  <p className="text-sm text-slate-500 mt-1">Happy Customers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">500+</p>
                  <p className="text-sm text-slate-500 mt-1">Cars Sold</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">10+</p>
                  <p className="text-sm text-slate-500 mt-1">Years Strong</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Showroom"
                className="rounded-2xl shadow-xl w-full aspect-[4/3] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-5 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">98%</p>
                    <p className="text-xs text-slate-500">Customer Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Our Mission</h3>
              <p className="text-slate-600 mt-3 leading-relaxed">
                To make quality vehicles accessible to everyone through transparent pricing, honest advice, and exceptional service — before, during, and long after the sale.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Our Vision</h3>
              <p className="text-slate-600 mt-3 leading-relaxed">
                To be the most trusted name in automotive retail, setting the standard for integrity, innovation, and customer care across the industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Our Core Values</h2>
            <p className="text-slate-500 mt-3">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <v.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Experience the AutoVerse Difference</h2>
          <p className="text-slate-400 mt-3">Visit our showroom or browse our inventory online today.</p>
          <Link
            to="/cars"
            className="inline-flex items-center gap-2 mt-6 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:shadow-xl"
          >
            Browse Cars
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
