// src/pages/Messages/Messages.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonBackButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonTextarea,
  IonSpinner,
} from '@ionic/react';
import {
  chatbubbleOutline,
  sendOutline,
  personOutline,
  checkmarkDoneOutline,
  timeOutline,
  checkmarkCircleOutline,
  lockClosedOutline,
  arrowBack,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';

const Messages: React.FC = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [completedMessages, setCompletedMessages] = useState<string[]>([]);

  // Mock conversations - in production, fetch from backend
  // Only show conversations where rider has ACCEPTED the order
  const conversations = [
    {
      id: 'conv1',
      orderId: '#1001',
      otherPerson: { id: 'rider1', name: 'Juan Dela Cruz', role: 'rider', image: '👨' },
      stallName: 'Burger King',
      lastMessage: 'I am on my way with your order!',
      unreadCount: 2,
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      status: 'active', // accepted, active, completed
      orderStatus: 'delivering',
      canStartDeal: false, // Only true when order is done
    },
    {
      id: 'conv2',
      orderId: '#1002',
      otherPerson: { id: 'rider2', name: 'Maria Gonzales', role: 'rider', image: '👩' },
      stallName: 'Sushi Master',
      lastMessage: 'Order has been delivered! Enjoy your meal',
      unreadCount: 0,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'active', // accepted, active, order ready for deal
      orderStatus: 'delivered',
      canStartDeal: true, // Can complete the deal now
    },
  ];

  // Auto-hide completed messages after 1 minute
  useEffect(() => {
    if (completedMessages.length === 0) return;

    const timer = setTimeout(() => {
      setCompletedMessages([]);
    }, 60000); // 1 minute

    return () => clearTimeout(timer);
  }, [completedMessages]);

  // Mock messages for selected conversation
  const getMessages = () => {
    const baseMessages = [
      {
        id: 'msg1',
        content: 'Hi, I have received your order',
        senderRole: 'rider',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: true,
        status: 'sent',
      },
      {
        id: 'msg2',
        content: 'Great! How long will it take?',
        senderRole: 'user',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        isRead: true,
        status: 'sent',
      },
      {
        id: 'msg3',
        content: 'I am on my way with your order!',
        senderRole: 'rider',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        isRead: false,
        status: 'sent',
      },
    ];

    // Add completed message if deal was just completed
    if (completedMessages.includes(selectedConversation?.id)) {
      baseMessages.push({
        id: 'msg_completed',
        content: '✓ Deal Completed! This conversation will close in 1 minute.',
        senderRole: 'system',
        timestamp: new Date(),
        isRead: true,
        status: 'completed',
      });
    }

    return baseMessages;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherPerson.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.stallName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return 'var(--ion-color-primary)';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In production, send to backend
      setNewMessage('');
    }
  };

  const handleCompleteDeal = () => {
    if (selectedConversation) {
      // Mark conversation as completed
      setCompletedMessages([...completedMessages, selectedConversation.id]);
      
      // Auto-close chat after 1 minute
      setTimeout(() => {
        setShowChat(false);
        setCompletedMessages(prev => prev.filter(id => id !== selectedConversation.id));
      }, 60000);
    }
  };

  return (
    <>

        {/* Header with Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <IonButton 
            fill="clear" 
            onClick={() => history.goBack()}
            style={{ '--color': 'var(--ion-color-primary)', margin: '0 0 0 -8px' } as any}
          >
            <IonIcon icon={arrowBack} />
          </IonButton>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--ion-text-color)', flex: 1 }}>
            Messages
          </h2>
          <div style={{ width: '44px' }}></div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px' }}>
          <IonSearchbar
            value={searchQuery}
            onIonChange={e => setSearchQuery(e.detail.value!)}
            placeholder="Search conversations..."
            style={{
              '--background': 'var(--ion-card-background)',
              '--border-radius': '12px',
              '--border': '1px solid var(--ion-border-color)',
              '--placeholder-color': 'var(--ion-text-color-secondary)',
              '--icon-color': 'var(--ion-color-primary)',
              '--color': 'var(--ion-text-color)',
              padding: '0',
              height: '48px',
            } as any}
          />
        </div>

        {/* Conversations List */}
        <div style={{ padding: '0 16px 16px' }}>
          {filteredConversations.length === 0 ? (
            <IonCard style={{ margin: 0, background: 'var(--ion-card-background)', textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--ion-text-color-secondary)', margin: 0 }}>No conversations found</p>
            </IonCard>
          ) : (
            filteredConversations.map(conv => (
              <IonCard
                key={conv.id}
                style={{ margin: '0 0 12px', background: 'var(--ion-card-background)', cursor: 'pointer' }}
                onClick={() => {
                  setSelectedConversation(conv);
                  setShowChat(true);
                }}
              >
                <IonCardContent style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {conv.otherPerson.image}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color)' }}>
                          {conv.otherPerson.name}
                        </h3>
                        <IonBadge style={{ '--background': getStatusColor(conv.status), fontSize: '9px' }}>
                          {conv.status}
                        </IonBadge>
                        {conv.unreadCount > 0 && (
                          <IonBadge style={{ '--background': 'var(--ion-color-primary)', fontSize: '9px' }}>
                            {conv.unreadCount}
                          </IonBadge>
                        )}
                      </div>

                      <p style={{ margin: '2px 0', fontSize: '11px', color: 'var(--ion-text-color-secondary)' }}>
                        {conv.stallName} • {conv.orderId}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          color: 'var(--ion-text-color)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}>
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--ion-text-color-secondary)', flexShrink: 0 }}>
                      {formatTime(conv.timestamp)}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        {/* Chat Modal */}
        <IonModal isOpen={showChat} onDidDismiss={() => setShowChat(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
              <IonButton slot="start" fill="clear" onClick={() => setShowChat(false)}>
                <IonBackButton />
              </IonButton>
              <div style={{ flex: 1 }}>
                <IonTitle style={{ fontSize: '14px' }}>
                {selectedConversation?.otherPerson.name}
              </IonTitle>
              <p style={{ margin: '0 0 0 16px', fontSize: '11px', color: 'var(--ion-text-color-secondary)' }}>
                {selectedConversation?.stallName} • {selectedConversation?.orderId}
              </p>
            </div>
          </IonToolbar>
          {selectedConversation && (
            <IonToolbar style={{ '--background': 'var(--ion-background-color)', '--border-bottom': '1px solid var(--ion-border-color)', paddingTop: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', width: '100%' }}>
                <span style={{ fontSize: '11px', color: 'var(--ion-text-color-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Order Status:</span>
                <IonBadge style={{
                  '--background': selectedConversation.orderStatus === 'delivering' ? '#F59E0B' : '#10B981',
                  fontSize: '10px'
                }}>
                  {selectedConversation.orderStatus.charAt(0).toUpperCase() + selectedConversation.orderStatus.slice(1)}
                </IonBadge>
              </div>
            </IonToolbar>
          )}
        </IonHeader>

        <IonContent style={{ '--background': 'var(--ion-background-color)' } as any}>
          {selectedConversation && (
            <>
              {/* Messages */}
              <div style={{ padding: '16px' }}>
                {getMessages().map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.senderRole === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '12px'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: msg.senderRole === 'user'
                          ? 'var(--ion-color-primary)'
                          : 'var(--ion-card-background)',
                        color: msg.senderRole === 'user' ? 'white' : 'var(--ion-text-color)',
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}
                    >
                      <p style={{ margin: '0 0 4px', wordBreak: 'break-word' }}>
                        {msg.content}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        opacity: 0.7,
                        justifyContent: 'flex-end'
                      }}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.senderRole === 'user' && msg.isRead && (
                          <IonIcon icon={checkmarkDoneOutline} style={{ fontSize: '12px' }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input & Deal Completion */}
              <div style={{
                position: 'sticky',
                bottom: 0,
                padding: '12px 16px',
                background: 'var(--ion-card-background)',
                borderTop: '1px solid var(--ion-border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {/* Deal Completion Button (only show if order is delivered and not completed yet) */}
                {selectedConversation?.canStartDeal && !completedMessages.includes(selectedConversation?.id) && (
                  <IonButton
                    expand="block"
                    style={{
                      '--background': '#10B981',
                      '--color': 'white',
                      margin: 0,
                      fontSize: '13px',
                      height: '44px'
                    }}
                    onClick={handleCompleteDeal}
                  >
                    <IonIcon icon={checkmarkCircleOutline} slot="start" />
                    Complete Deal
                  </IonButton>
                )}

                {/* Deal Completed Status */}
                {completedMessages.includes(selectedConversation?.id) && (
                  <div style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '16px' }} />
                    <div>
                      <p style={{ margin: 0 }}>Deal Completed!</p>
                      <p style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>This chat will close in 1 minute</p>
                    </div>
                  </div>
                )}

                {/* Message Input (only show if not completed) */}
                {!completedMessages.includes(selectedConversation?.id) && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <IonTextarea
                      value={newMessage}
                      onIonChange={e => setNewMessage(e.detail.value!)}
                      placeholder="Type your message..."
                      style={{
                        '--background': 'var(--ion-background-color)',
                        '--border-radius': '8px',
                        '--padding-start': '12px',
                        '--padding-end': '12px',
                        '--padding-top': '10px',
                        '--padding-bottom': '10px',
                        fontSize: '13px',
                      } as any}
                      rows={1}
                      autoGrow
                    />
                    <IonButton
                      fill="solid"
                      style={{
                        '--background': 'var(--ion-color-primary)',
                        '--color': 'white',
                        width: '44px',
                        height: '44px',
                        margin: 0
                      }}
                      onClick={handleSendMessage}
                    >
                      <IonIcon icon={sendOutline} />
                    </IonButton>
                  </div>
                )}
              </div>
            </>
          )}
        </IonContent>
      </IonModal>
      </>
  );
};

export default Messages;
