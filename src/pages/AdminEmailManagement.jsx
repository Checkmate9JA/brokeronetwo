import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Send, Search, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User as UserEntity } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AdminEmailManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await UserEntity.list();
      // Sort users alphabetically by name for better UX
      const sortedUsers = fetchedUsers.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setFeedback({ type: 'error', message: 'Failed to load users' });
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (!selectedUser || !subject || !message) {
      setFeedback({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setIsSending(true);
    try {
      await SendEmail({
        to: selectedUser.email,
        subject: subject,
        body: message
      });
      
      setFeedback({ type: 'success', message: `Email sent successfully to ${selectedUser.full_name}!` });
      
      // Reset form
      setSelectedUser(null);
      setSubject('');
      setMessage('');
      setUserSearchTerm('');
    } catch (error) {
      console.error('Error sending email:', error);
      setFeedback({ type: 'error', message: 'Failed to send email. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUserSearchTerm(user.full_name);
    setIsUserDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
              <p className="text-gray-600">Send emails to users</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        {/* Feedback */}
        {feedback.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            feedback.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {feedback.message}
          </div>
        )}

        {/* Email Form */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Send Email</h2>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-6">
            {/* Recipient Selection */}
            <div>
              <Label htmlFor="recipient" className="text-base font-semibold">
                Recipient
              </Label>
              <p className="text-sm text-gray-500 mb-3">Select a user to send the email to</p>
              
              <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isUserDropdownOpen}
                    className="w-full justify-between h-12"
                  >
                    {selectedUser ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{selectedUser.full_name}</div>
                          <div className="text-sm text-gray-500">{selectedUser.email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Select a user...</span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onValueChange={setUserSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {filteredUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.full_name}
                            onSelect={() => handleUserSelect(user)}
                            className="flex items-center gap-3 p-3"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                            <Badge className="ml-auto" variant="outline">
                              {user.role}
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject" className="text-base font-semibold">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-2 h-12"
                required
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message" className="text-base font-semibold">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 min-h-40"
                required
              />
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={isSending || !selectedUser || !subject || !message}
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}