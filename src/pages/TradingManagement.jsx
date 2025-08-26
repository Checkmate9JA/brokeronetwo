
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Settings, Trash2, Edit, Eye, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TradingInstrument } from '@/api/entities';
import AddInstrumentModal from '../components/modals/AddInstrumentModal';
import EditInstrumentModal from '../components/modals/EditInstrumentModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import AddSymbolModal from '../components/modals/AddSymbolModal';
import EditSymbolModal from '../components/modals/EditSymbolModal';
import InstrumentSettingsModal from '../components/modals/InstrumentSettingsModal';

export default function TradingManagement() {
    const [instruments, setInstruments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddInstrumentModalOpen, setIsAddInstrumentModalOpen] = useState(false);
    const [isEditInstrumentModalOpen, setIsEditInstrumentModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddSymbolModalOpen, setIsAddSymbolModalOpen] = useState(false);
    const [isEditSymbolModalOpen, setIsEditSymbolModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [selectedSymbol, setSelectedSymbol] = useState(null);

    useEffect(() => {
        loadInstruments();
    }, []);

    const loadInstruments = async () => {
        setIsLoading(true);
        try {
            const fetchedInstruments = await TradingInstrument.list();
            setInstruments(fetchedInstruments);
        } catch (error) {
            console.error("Error loading instruments:", error);
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
            await TradingInstrument.delete(selectedInstrument.id);
            loadInstruments();
        } catch (error) {
            console.error("Error deleting instrument:", error);
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedInstrument(null);
        }
    };

    const handleAddSymbol = (instrument) => {
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


    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
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
                        <Button onClick={() => handleAddSymbol(null)} variant="outline" className="w-full md:w-auto">
                            <PlusCircle className="w-4 h-4 mr-2" />
                             <span className="hidden md:inline">Add Symbol</span>
                            <span className="md:hidden">Symbol</span>
                        </Button>
                    </div>
                </div>


                {isLoading ? (
                    <div className="text-center py-12">Loading instruments...</div>
                ) : (
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
                                    <Button variant="outline" size="sm" onClick={() => handleSettings(instrument)} className="w-full">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Symbols
                                    </Button>
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
                )}
            </div>

            {/* Modals */}
            <AddInstrumentModal 
                isOpen={isAddInstrumentModalOpen} 
                onClose={() => setIsAddInstrumentModalOpen(false)} 
                onSuccess={loadInstruments} 
            />
            <EditInstrumentModal 
                isOpen={isEditInstrumentModalOpen} 
                onClose={() => setIsEditInstrumentModalOpen(false)} 
                onSuccess={loadInstruments}
                instrument={selectedInstrument}
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
                onSuccess={() => {}} // Might need a refresh logic here
                instrumentId={selectedInstrument?.id}
                instruments={instruments}
            />
             <EditSymbolModal
                isOpen={isEditSymbolModalOpen}
                onClose={() => setIsEditSymbolModalOpen(false)}
                onSuccess={() => {}} // Might need a refresh logic here
                instrumentId={selectedInstrument?.id}
                symbol={selectedSymbol}
            />
             <InstrumentSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                instrument={selectedInstrument}
            />
        </div>
    );
}
