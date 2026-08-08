import React, { useState } from 'react';
import {
  IonContent, IonCard, IonCardContent,
  IonIcon, IonBadge, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonBackButton, IonTextarea,
  IonItem, IonSelect, IonSelectOption,
} from '@ionic/react';
import { warningOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { Report } from '../../types';
import AdminPageShell from '../../components/admin/AdminPageShell';
import FilterPills from '../../components/FilterPills';

const AdminReports: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reports, setReports] = useState<Report[]>([]);

  const filteredReports = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (r.title || '').toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const getPriorityColor = (p: string) => p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#6B7280';
  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = { open: '#EF4444', under_review: '#F59E0B', resolved: '#10B981', rejected: '#6B7280', closed: '#9CA3AF' };
    return colors[s] || '#9CA3AF';
  };

  const openDetails = (report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setResolution(report.resolution || '');
    setShowDetails(true);
  };

  const saveResolution = () => {
    if (!selectedReport) return;
    setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status: newStatus as Report['status'], resolution, adminNotes: resolution, updatedAt: new Date(), resolvedAt: newStatus === 'resolved' ? new Date() : r.resolvedAt, resolvedBy: newStatus === 'resolved' ? 'admin1' : r.resolvedBy } : r));
    setShowDetails(false);
  };

  return (
    <>
      <AdminPageShell
        title="Manage Reports"
        search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search reports...' }}
      >
        <div>
          <div className="mb-4">
            <FilterPills
              layoutId="admin-reports-status"
              even
              value={filterStatus}
              onChange={setFilterStatus}
              items={[
                { id: 'all', label: 'All' },
                { id: 'open', label: 'Open' },
                { id: 'under_review', label: 'Review' },
                { id: 'resolved', label: 'Resolved' },
                { id: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>
          <div className="mb-4">
            <FilterPills
              layoutId="admin-reports-priority"
              even
              value={filterPriority}
              onChange={setFilterPriority}
              items={[
                { id: 'all', label: 'All Priority' },
                { id: 'high', label: '🔥 High' },
                { id: 'medium', label: '⚡ Medium' },
                { id: 'low', label: '💤 Low' },
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <IonCard style={{ margin: 0, background: 'var(--ion-card-background)' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>Total Reports</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: 'var(--ion-text-color)' }}>{reports.length}</h3>
              </IonCardContent>
            </IonCard>
            <IonCard style={{ margin: 0, background: 'var(--ion-card-background)' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>Open</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#EF4444' }}>{reports.filter(r => r.status === 'open').length}</h3>
              </IonCardContent>
            </IonCard>
          </div>
        </div>

        <div>
          {filteredReports.length === 0 ? (
            <IonCard style={{ margin: 0, background: 'var(--ion-card-background)', textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--ion-text-color-secondary)' }}>No reports found</p>
            </IonCard>
          ) : (
            filteredReports.map(report => (
              <IonCard key={report.id} className="cursor-pointer hover:shadow-lg transition-shadow duration-200 mb-4" style={{ margin: 0, background: 'var(--ion-card-background)' }} onClick={() => openDetails(report)}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <IonIcon icon={warningOutline} style={{ color: getPriorityColor(report.priority || 'low'), fontSize: '16px' }} />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ion-text-color)' }}>{report.title}</h3>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ion-text-color-secondary)' }}>{report.id}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <IonBadge style={{ '--background': getPriorityColor(report.priority || 'low'), color: 'white', fontSize: '10px' }}>{report.priority}</IonBadge>
                      <IonBadge style={{ '--background': getStatusColor(report.status), color: 'white', fontSize: '10px' }}>{report.status.replace('_', ' ')}</IonBadge>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {report.description}
                  </p>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>
      </AdminPageShell>

      <IonModal isOpen={showDetails} onDidDismiss={() => setShowDetails(false)}>
        <IonHeader>
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' } as React.CSSProperties}>
            <IonButton slot="start" fill="clear" onClick={() => setShowDetails(false)}><IonBackButton /></IonButton>
            <IonTitle>Report Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-background-color)' } as React.CSSProperties}>
          {selectedReport && (
            <div style={{ padding: '16px' }}>
              <IonCard style={{ margin: 0, background: 'var(--ion-card-background)' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--ion-border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <IonIcon icon={warningOutline} style={{ color: getPriorityColor(selectedReport.priority || 'low'), fontSize: '20px' }} />
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ion-text-color)' }}>{selectedReport.title}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <IonBadge style={{ '--background': getPriorityColor(selectedReport.priority || 'low'), color: 'white' }}>{selectedReport.priority}</IonBadge>
                      <IonBadge style={{ '--background': getStatusColor(selectedReport.status), color: 'white' }}>{selectedReport.status.replace('_', ' ')}</IonBadge>
                      <IonBadge color="primary">{selectedReport.type}</IonBadge>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', background: 'var(--ion-background-color)', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--ion-text-color-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Description</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color)' }}>{selectedReport.description}</p>
                    </div>
                    {selectedReport.adminNotes && (
                      <div style={{ padding: '12px', background: 'var(--ion-background-color)', borderRadius: '8px', borderLeft: '4px solid var(--ion-color-primary)' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--ion-color-primary)', textTransform: 'uppercase', fontWeight: 600 }}>Admin Notes</p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color)' }}>{selectedReport.adminNotes}</p>
                      </div>
                    )}
                    <div style={{ padding: '12px', background: 'var(--ion-background-color)', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--ion-text-color-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Reporter</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color)' }}>{selectedReport.reporterRole} • {selectedReport.reporterId}</p>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--ion-background-color)', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--ion-text-color-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Timeline</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color)' }}>
                        Created: {selectedReport.createdAt instanceof Date ? selectedReport.createdAt.toLocaleString() : String(selectedReport.createdAt)}
                      </p>
                      {selectedReport.resolvedAt && (
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ion-text-color)' }}>
                          Resolved: {selectedReport.resolvedAt instanceof Date ? selectedReport.resolvedAt.toLocaleString() : String(selectedReport.resolvedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--ion-background-color)', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Update Status</h4>
                    <IonItem style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0, marginBottom: '16px' }}>
                      <IonSelect value={newStatus} onIonChange={e => setNewStatus(e.detail.value)} interface="popover" style={{ width: '100%' }}>
                        <IonSelectOption value="open">Open</IonSelectOption>
                        <IonSelectOption value="under_review">Under Review</IonSelectOption>
                        <IonSelectOption value="resolved">Resolved</IonSelectOption>
                        <IonSelectOption value="rejected">Rejected</IonSelectOption>
                        <IonSelectOption value="closed">Closed</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                    <IonTextarea
                      value={resolution}
                      onIonChange={e => setResolution(e.detail.value!)}
                      placeholder="Add resolution notes..."
                      rows={3}
                      className="mb-4"
                    />
                    <IonButton expand="block" onClick={saveResolution}>
                      <IonIcon slot="start" icon={shieldCheckmarkOutline} />
                      Save Changes
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};

export default AdminReports;
