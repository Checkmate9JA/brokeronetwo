
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
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

    useEffect(() => {
        console.log('🔍 TradingManagement useEffect - User state:', { user: !!user, userProfile: !!userProfile });
        console.log('🔍 User details:', { 
            user: user ? { id: user.id, email: user.email } : null, 
            userProfile: userProfile ? { id: userProfile.id, email: userProfile.email, role: userProfile.role } : null 
        });
        if (user && userProfile) {
            console.log('✅ User authenticated, loading instruments...');
            loadInstruments();
        } else {
            console.log('⏳ Waiting for user authentication...');
        }
    }, [user, userProfile]);

    const loadInstruments = async () => {
        console.log('🔍 Loading trading instruments...');
        setIsLoading(true);
        try {
            // First, let's test the connection and see what's in the table
            console.log('🔍 Testing Supabase connection...');
            const { data: testData, error: testError } = await supabase
                .from('trading_instruments')
                .select('count');
            
            if (testError) {
                console.error('❌ Test query failed:', testError);
            } else {
                console.log('✅ Test query successful, count:', testData);
            }

            // Now load the actual instruments
            const { data, error } = await supabase
                .from('trading_instruments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }
            console.log('✅ Instruments loaded successfully:', data);
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

    const showFeedback = (type, title, message) => {
        setFeedback({ isOpen: true, type, title, message });
    };

    const testDatabaseConnection = async () => {
        console.log('🔍 Testing database connection...');
        try {
            // Test 1: Check if we can read from the table
            const { data: readData, error: readError } = await supabase
                .from('trading_instruments')
                .select('*')
                .limit(1);
            
            if (readError) {
                console.error('❌ Read test failed:', readError);
                showFeedback('error', 'Database Test Failed', `Read test failed: ${readError.message}`);
                return;
            }
            console.log('✅ Read test successful:', readData);

            // Test 2: Try to insert a test record
            const testInstrument = {
                name: 'TEST_INSTRUMENT_' + Date.now(),
                description: 'This is a test instrument',
                icon: '🧪',
                market_type: 'spot',
                leverage_options: '1x,2x',
                is_active: true
            };

            const { data: insertData, error: insertError } = await supabase
                .from('trading_instruments')
                .insert([testInstrument])
                .select();

            if (insertError) {
                console.error('❌ Insert test failed:', insertError);
                showFeedback('error', 'Database Test Failed', `Insert test failed: ${insertError.message}`);
                return;
            }
            console.log('✅ Insert test successful:', insertData);

            // Test 3: Delete the test record
            if (insertData && insertData[0]) {
                const { error: deleteError } = await supabase
                    .from('trading_instruments')
                    .delete()
                    .eq('id', insertData[0].id);

                if (deleteError) {
                    console.error('❌ Delete test failed:', deleteError);
                } else {
                    console.log('✅ Delete test successful');
                }
            }

            showFeedback('success', 'Database Test Successful', 'All database operations are working correctly!');
            
        } catch (error) {
            console.error('❌ Database test failed:', error);
            showFeedback('error', 'Database Test Failed', `Test failed: ${error.message}`);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
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
                                <Button 
                                    variant="outline" 
                                    className="w-full md:w-auto"
                                    disabled={true}
                                    title="Add symbols from individual instrument cards"
                                >
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    <span className="hidden md:inline">Add Symbol</span>
                                    <span className="md:hidden">Symbol</span>
                                </Button>
                                <Button 
                                    onClick={testDatabaseConnection}
                                    variant="outline" 
                                    className="w-full md:w-auto"
                                    title="Test database connection"
                                >
                                    🧪 Test DB
                                </Button>
                            </div>
                        </div>


                        {isLoading ? (
                            <div className="text-center py-12">Loading instruments...</div>
                        ) : (
                            <>
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        {instruments.length === 0 ? 'No instruments found' : `${instruments.length} instrument(s) loaded`}
                                    </div>
                                    <Button 
                                        onClick={loadInstruments} 
                                        variant="outline" 
                                        size="sm"
                                        disabled={isLoading}
                                    >
                                        🔄 Refresh
                                    </Button>
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
                                                    <Button variant="outline" size="sm" onClick={() => handleSettings(instrument)} className="flex-1">
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
