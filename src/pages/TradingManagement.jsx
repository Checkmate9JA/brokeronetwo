
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Settings, Trash2, Edit, Eye, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AddInstrumentModal from '../components/modals/AddInstrumentModal';
import EditInstrumentModal from '../components/modals/EditInstrumentModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import AddSymbolModal from '../components/modals/AddSymbolModal';
import EditSymbolModal from '../components/modals/EditSymbolModal';
import InstrumentSettingsModal from '../components/modals/InstrumentSettingsModal';
import ViewSymbolsModal from '../components/modals/ViewSymbolsModal';
import FeedbackModal from '../components/modals/FeedbackModal';

export default function TradingManagement() {
    const { user, userProfile } = useAuth();
    const [instruments, setInstruments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddInstrumentModalOpen, setIsAddInstrumentModalOpen] = useState(false);
    const [isEditInstrumentModalOpen, setIsEditInstrumentModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddSymbolModalOpen, setIsAddSymbolModalOpen] = useState(false);
    const [isEditSymbolModalOpen, setIsEditSymbolModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isViewSymbolsModalOpen, setIsViewSymbolsModalOpen] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

    useEffect(() => {
        if (user && userProfile) {
            loadInstruments();
        }
    }, [user, userProfile]);

    const loadInstruments = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('trading_instruments')
                .select('*')
                .order('name', { ascending: true }); // Sort alphabetically by name

            if (error) {
                throw error;
            }
            setInstruments(data || []);
        } catch (error) {
            console.error("❌ Error loading instruments:", error);
            showFeedback('error', 'Load Failed', `Failed to load trading instruments: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddInstrument = () => {
        setSelectedInstrument(null);
        setIsAddInstrumentModalOpen(true);
    };

    const handleEditInstrument = (instrument) => {
        setSelectedInstrument(instrument);
        setIsEditInstrumentModalOpen(true);
    };
    
    const handleDeleteInstrument = (instrument) => {
        setSelectedInstrument(instrument);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteInstrument = async () => {
        if (!selectedInstrument) return;
        try {
            const { error } = await supabase
                .from('trading_instruments')
                .delete()
                .eq('id', selectedInstrument.id);

            if (error) {
                throw error;
            }
            loadInstruments();
        } catch (error) {
            console.error("Error deleting instrument:", error);
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedInstrument(null);
        }
    };

    const handleAddSymbol = (instrument) => {
        if (!instrument) {
            showFeedback('error', 'No Instrument Selected', 'Please select a trading instrument first before adding a symbol.');
            return;
        }
        setSelectedInstrument(instrument);
        setIsAddSymbolModalOpen(true);
    };

    const handleEditSymbol = (instrument, symbol) => {
        setSelectedInstrument(instrument);
        setSelectedSymbol(symbol);
        setIsEditSymbolModalOpen(true);
    };

    const handleSettings = (instrument) => {
        setSelectedInstrument(instrument);
        setIsSettingsModalOpen(true);
    };

    const handleViewSymbols = (instrument) => {
        setSelectedInstrument(instrument);
        setIsViewSymbolsModalOpen(true);
    };

    const showFeedback = (type, title, message) => {
        setFeedback({ isOpen: true, type, title, message });
    };




    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 admin-page">
            <div className="max-w-7xl mx-auto">
                {/* Check if user is authenticated */}
                {!user || !userProfile ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading authentication...</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="md:flex md:items-center md:justify-between mb-8">
                            <div className="flex items-center gap-2 mb-4 md:mb-0">
                                <Link to={createPageUrl('AdminDashboard')}>
                                    <Button variant="ghost" size="icon" className="md:mr-2">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Trade Management</h1>
                                    <p className="text-sm text-gray-500 mt-1 hidden md:block">
                                        Create, manage, and configure trading instruments and symbols.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleAddInstrument} className="w-full md:w-auto">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    <span className="hidden md:inline">Add Instrument</span>
                                    <span className="md:hidden">Instrument</span>
                                </Button>
                            </div>
                        </div>


                        {isLoading ? (
                            <div className="text-center py-12">Loading instruments...</div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <div className="text-sm text-gray-600">
                                        {instruments.length === 0 ? 'No instruments found' : `${instruments.length} instrument(s) loaded`}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {instruments.map(instrument => (
                                        <Card key={instrument.id} className="bg-white flex flex-col relative">
                                            <CardHeader>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl">{instrument.icon || '📈'}</span>
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg font-semibold">{instrument.name}</CardTitle>
                                                        <CardDescription className="text-sm">{instrument.description}</CardDescription>
                                                    </div>
                                                </div>
                                                <div className="absolute top-4 right-4">
                                                    {instrument.is_active ? (
                                                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">Active</span>
                                                    ) : (
                                                        <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">Inactive</span>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-grow text-center">
                                                <div className="text-xs text-gray-500 space-y-2">
                                                    <p><strong>Market:</strong> <span className="uppercase">{instrument.market_type}</span></p>
                                                    <p><strong>Leverage:</strong> {instrument.leverage_options}</p>
                                                    <p><strong>Trading Fee:</strong> {instrument.trading_fee_percentage}%</p>
                                                </div>
                                            </CardContent>
                                                                                    <CardFooter className="flex flex-col items-stretch gap-2">
                                            <div className="flex gap-2 w-full">
                                                <Button variant="outline" size="sm" onClick={() => handleViewSymbols(instrument)} className="flex-1">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Symbols
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleAddSymbol(instrument)} className="flex-1">
                                                    <PlusCircle className="w-4 h-4 mr-2" />
                                                    Add Symbol
                                                </Button>
                                            </div>
                                            <div className="flex gap-2 justify-center w-full">
                                                <Button variant="ghost" size="icon" onClick={() => handleSettings(instrument)}>
                                                    <Settings className="w-4 h-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditInstrument(instrument)}>
                                                    <Edit className="w-4 h-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteInstrument(instrument)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                                {instruments.length === 0 && !isLoading && (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 text-6xl mb-4">📊</div>
                                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Trading Instruments Found</h3>
                                        <p className="text-gray-500 mb-6">Get started by creating your first trading instrument.</p>
                                        <Button onClick={handleAddInstrument} className="bg-blue-600 hover:bg-blue-700">
                                            <PlusCircle className="w-4 h-4 mr-2" />
                                            Create First Instrument
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <AddInstrumentModal 
                isOpen={isAddInstrumentModalOpen} 
                onClose={() => setIsAddInstrumentModalOpen(false)} 
                onSuccess={loadInstruments} 
                onFeedback={showFeedback}
            />
            <EditInstrumentModal 
                isOpen={isEditInstrumentModalOpen} 
                onClose={() => setIsEditInstrumentModalOpen(false)} 
                onSuccess={loadInstruments}
                instrument={selectedInstrument}
                onFeedback={showFeedback}
            />
            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteInstrument}
                title="Delete Instrument"
                description={`Are you sure you want to delete the instrument "${selectedInstrument?.name}"? This will also delete all associated symbols.`}
            />
            <AddSymbolModal 
                isOpen={isAddSymbolModalOpen}
                onClose={() => setIsAddSymbolModalOpen(false)}
                onSuccess={loadInstruments}
                instrument={selectedInstrument}
                onFeedback={showFeedback}
            />
             <EditSymbolModal
                isOpen={isEditSymbolModalOpen}
                onClose={() => setIsEditSymbolModalOpen(false)}
                onSuccess={loadInstruments}
                symbol={selectedSymbol}
                onFeedback={showFeedback}
            />
             <InstrumentSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                instrument={selectedInstrument}
                onSuccess={loadInstruments}
                onFeedback={showFeedback}
            />
            <ViewSymbolsModal
                isOpen={isViewSymbolsModalOpen}
                onClose={() => setIsViewSymbolsModalOpen(false)}
                instrument={selectedInstrument}
                onAddSymbol={handleAddSymbol}
                onEditSymbol={handleEditSymbol}
                onDeleteSymbol={() => {}} // This will be handled by the modal itself
            />
            <FeedbackModal
                isOpen={feedback.isOpen}
                onClose={() => setFeedback({ ...feedback, isOpen: false })}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
            />
        </div>
    );
}
