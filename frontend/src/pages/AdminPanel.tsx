import React, { useState, useEffect, useRef } from 'react';

import { Routes, Route, Link, useLocation } from 'react-router-dom';

import { Map, Users, BarChart, Vote, Building2, Calculator } from 'lucide-react';

import ProvinceManagement from '../components/admin/ProvinceManagement';

import DistrictManagement from '../components/admin/DistrictManagement';

import PartyManagement from '../components/admin/PartyManagement';

import ResultsManagement from '../components/admin/ResultsManagement';

import SeatCalculation from '../components/admin/SeatCalculation';



const AdminPanel: React.FC = () => {

  const location = useLocation();

  const sidebarRef = useRef<HTMLDivElement>(null);

  const [sidebarPosition, setSidebarPosition] = useState({ top: 0, left: 0 });



  useEffect(() => {

    if (sidebarRef.current) {

      const rect = sidebarRef.current.getBoundingClientRect();

      setSidebarPosition({ top: rect.top, left: rect.left });

    }

  }, []);



  // Navigation links with paths and icons

  const navLinks = [

    {

      path: '/admin/provinces',

      label: 'Province Management',

      icon: <Building2 className="w-5 h-5" />

    },

    {

      path: '/admin/districts',

      label: 'District Management',

      icon: <Map className="w-5 h-5" />

    },

    {

      path: '/admin/parties',

      label: 'Party Management',

      icon: <Users className="w-5 h-5" />

    },

    {

      path: '/admin/calculation',

      label: 'Seat Calculation',

      icon: <Calculator className="w-5 h-5" />

    },

    {

      path: '/admin/results',

      label: 'Latest Update',

      icon: <Vote className="w-5 h-5" />

    }

  ];



  // Check if the path is active

  const isActive = (path: string) => {

    return location.pathname === path;

  };



  const adminTabs = [

    { id: 'province', label: 'Province Management', component: ProvinceManagement },

    { id: 'district', label: 'District Management', component: DistrictManagement },

    { id: 'party', label: 'Party Management', component: PartyManagement },

    { id: 'seat', label: 'Seat Calculation', component: SeatCalculation },

    { id: 'results', label: 'Latest Update', component: ResultsManagement },

  ];



  const activeTab = adminTabs.find(tab => location.pathname.startsWith(tab.id))?.id;



  const AdminPanelContent = adminTabs.find(tab => tab.id === activeTab)?.component;



  return (

    <div className="min-h-screen bg-[#FDFAF6]">

      {/* Header with blue gradient */}

      <div className="text-center py-6">

        <div className="container mx-auto px-4">

          <div className="flex flex-col items-center justify-center text-center">

            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#3B2E5A] to-[#6A2C70] bg-clip-text text-transparent">Admin Panel</h1>

            <p className="mt-2 text-black text-sm">

              Manage election data, provinces, districts, and parties

            </p>

          </div>

        </div>

      </div>



      <div className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar Navigation */}

          <div className="lg:col-span-3">

            <div className="relative" ref={sidebarRef}>

              <div 

                className="bg-white rounded-lg shadow-md overflow-y-auto"

                style={{

                  width: '100%',

                  height: 'calc(100vh - 4rem)',

                  overflowY: 'auto'

                }}

              >

                <div className="flex flex-col">

                  <div className="p-8 bg-white">

                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Election Admin Dashboard</h2>

                    <p className="text-gray-600 text-sm mb-2">Manage election data and settings</p>

                  </div>

                  <nav className="px-4 pb-8 pt-4">

                    <ul className="space-y-3">

                      {navLinks.map((link) => (

                        <li key={link.path}>

                          <Link

                            to={link.path}

                            className={`flex items-center px-6 py-3 rounded-md transition-colors ${isActive(link.path)

                              ? 'bg-[#9B7EBD] text-white font-medium'

                              : 'text-gray-700 hover:bg-[#9B7EBD]/20'

                              }`}

                          >

                            <span className="mr-3">{link.icon}</span>

                            {link.label}

                          </Link>

                        </li>

                      ))}

                    </ul>

                  </nav>

                </div>

              </div>

              {/* Spacer div to maintain layout */}

              <div className="opacity-0 pointer-events-none">

                <div className="p-8">

                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Admin Panel</h2>

                  <p className="text-gray-600 text-sm mb-2">Manage election data and settings</p>

                </div>

                <nav className="px-4 pb-8 pt-4">

                  <ul className="space-y-3">

                    {navLinks.map((link) => (

                      <li key={link.path}>

                        <div className="px-6 py-3">

                          <span className="mr-3">{link.icon}</span>

                          {link.label}

                        </div>

                      </li>

                    ))}

                  </ul>

                </nav>

              </div>

            </div>

          </div>



          {/* Main Content Area */}

          <div className="lg:col-span-9">

            <div className="bg-white rounded-lg shadow-md min-h-[calc(100vh-12rem)] p-8">

              <Routes>

                <Route path="/" element={<ProvinceManagement />} />

                <Route path="/provinces" element={<ProvinceManagement />} />

                <Route path="/districts" element={<DistrictManagement />} />

                <Route path="/calculation" element={<SeatCalculation />} />

                <Route path="/parties" element={<PartyManagement />} />

                <Route path="/results" element={<ResultsManagement />} />

              </Routes>

            </div>

          </div>

        </div>

      </div>



      {/* Add bottom padding to ensure content doesn't get cut off when scrolling */}

      <div className="pb-8"></div>

    </div>

  );

};



export default AdminPanel;