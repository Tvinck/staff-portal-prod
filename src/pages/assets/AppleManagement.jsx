import React, { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, Calendar, Plus, Search, Clock, ShieldCheck, RefreshCw, Trash2, Save, Key, FileBadge, Settings
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import Modal from '../../components/ui/Modal';
import './Assets.css';

// -------------------------------------------------------------
// DEVICES TAB
// -------------------------------------------------------------
const DevicesTab = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ udid: '', device_info: '', expires_at: '', status: 'active' });

  const resetForm = () => setFormData({ udid: '', device_info: '', expires_at: '', status: 'active' });

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('apple_certs')
      .select('*')
      .order('registered_at', { ascending: false });
    
    if (error) console.error('Error fetching certs:', error);
    else setCerts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);

  const handleSave = async () => {
    if (!formData.udid) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('apple_certs').insert([{
        ...formData,
        registered_at: new Date().toISOString()
      }]);
      if (error) throw error;
      setShowModal(false);
      resetForm();
      fetchCerts();
    } catch (err) {
      console.error('Save error:', err);
      alert('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот UDID?')) return;
    const { error } = await supabase.from('apple_certs').delete().eq('id', id);
    if (!error) fetchCerts();
  };

  const syncWithApple = async () => {
    try {
      setLoading(true);
      const { data, error: fnError } = await supabase.functions.invoke('apple-developer-api', {
        body: { action: 'getDevices' }
      });
      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      const appleDevices = data.data || [];
      if (appleDevices.length === 0) {
        alert('Устройства не найдены в Apple Developer.');
        return;
      }

      // Prepare for upsert
      const upsertPayload = appleDevices.map(device => ({
        udid: device.attributes.udid,
        device_info: device.attributes.name || device.attributes.deviceClass,
        status: device.attributes.status === 'ENABLED' ? 'active' : 'revoked',
        registered_at: device.attributes.addedDate,
        expires_at: new Date(new Date(device.attributes.addedDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() // Apple devices expire 1 year after adding
      }));

      // In Supabase, we might not have a UNIQUE constraint on udid, so we do a simple
      // fetch all existing udids, and only insert the new ones, or update existing ones.
      // To simplify, we'll just alert success for now and fetchCerts if backend handles upsert.
      // Easiest is to upsert on 'udid' if it's unique, but we assume it might not be.
      // For now, let's just insert them, ignoring duplicates if we can't upsert safely.
      // Let's manually filter duplicates based on existing certs state.
      
      const existingUdids = new Set(certs.map(c => c.udid));
      const newDevices = upsertPayload.filter(p => !existingUdids.has(p.udid));

      if (newDevices.length > 0) {
        const { error } = await supabase.from('apple_certs').insert(newDevices);
        if (error) throw error;
      }
      
      alert(`Синхронизация завершена. Добавлено ${newDevices.length} новых устройств.`);
      fetchCerts();
    } catch (err) {
      alert('Ошибка синхронизации: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return 'N/A';
    const diffTime = new Date(expiryDate) - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredCerts = certs.filter(cert => 
    cert.udid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.device_info?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="module-controls">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" placeholder="Поиск по UDID или устройству..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{display: 'flex', gap: '8px'}}>
          <button className="btn-outline" onClick={syncWithApple}>
            <RefreshCw size={18} />
            Синхронизировать
          </button>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={18} />
            Регистрация UDID
          </button>
        </div>
      </div>

      <div className="table-container glass-card">
        <table className="assets-table">
          <thead>
            <tr>
              <th>Устройство / UDID</th>
              <th>Дата регистрации</th>
              <th>Статус</th>
              <th>Осталось дней</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}><div className="loader"></div></td></tr>
            ) : filteredCerts.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>Устройства не найдены</td></tr>
            ) : filteredCerts.map(cert => {
              const daysLeft = getDaysLeft(cert.expires_at);
              return (
                <tr key={cert.id}>
                  <td>
                    <div className="udid-cell">
                      <Smartphone size={16} style={{ color: 'var(--text-dim)' }} />
                      <div>
                        <div className="device-name">{cert.device_info || 'Unknown Device'}</div>
                        <div className="udid-code">{cert.udid}</div>
                      </div>
                    </div>
                  </td>
                  <td>{cert.registered_at ? new Date(cert.registered_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`status-pill ${cert.status}`}>
                      {cert.status === 'active' ? 'Активен' : cert.status === 'revoked' ? 'Отозван' : 'Ожидание'}
                    </span>
                  </td>
                  <td>
                    <div className={`days-countdown ${typeof daysLeft === 'number' && daysLeft < 30 ? 'critical' : ''}`}>
                      <Clock size={14} />
                      {typeof daysLeft === 'number' ? `${daysLeft} дн.` : daysLeft}
                    </div>
                  </td>
                  <td>
                    <button className="btn-outline btn-sm text-danger" onClick={() => handleDelete(cert.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Регистрация нового UDID"
        footer={
          <>
            <button className="btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>Отмена</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !formData.udid}>
              <Save size={16} />
              {saving ? 'Сохранение...' : 'Зарегистрировать'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>UDID</label>
          <input type="text" value={formData.udid} onChange={(e) => setFormData({...formData, udid: e.target.value})} placeholder="00000000-0000000000000000" />
        </div>
        <div className="form-group">
          <label>Устройство</label>
          <input type="text" value={formData.device_info} onChange={(e) => setFormData({...formData, device_info: e.target.value})} placeholder="iPhone 15 Pro Max" />
        </div>
        <div className="form-group">
          <label>Дата истечения</label>
          <input type="date" value={formData.expires_at} onChange={(e) => setFormData({...formData, expires_at: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Статус</label>
          <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
            <option value="active">Активен</option>
            <option value="pending">Ожидание</option>
            <option value="revoked">Отозван</option>
          </select>
        </div>
      </Modal>
    </>
  );
};

// -------------------------------------------------------------
// CERTIFICATES TAB
// -------------------------------------------------------------
const CertificatesTab = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('apple-developer-api', {
        body: { action: 'getCertificates' }
      });
      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);
      setCerts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCerts(); }, []);

  return (
    <div className="glass-card">
      <div className="module-controls" style={{padding: '24px', borderBottom: '1px solid var(--border-color)'}}>
        <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
          <ShieldCheck size={20} color="var(--accent-primary)" />
          Сертификаты Apple
        </h3>
        <button className="btn-outline" onClick={loadCerts} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Обновить
        </button>
      </div>

      <div className="table-container">
        {error && <div style={{padding: '16px', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)'}}>{error}</div>}
        <table className="assets-table">
          <thead>
            <tr>
              <th>Название / ID</th>
              <th>Тип</th>
              <th>Платформа</th>
              <th>Истекает</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && certs.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px'}}><div className="loader"></div></td></tr>
            ) : certs.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px', color: 'var(--text-dim)'}}>Сертификаты не найдены. Проверьте API ключи.</td></tr>
            ) : certs.map(c => {
              const attrs = c.attributes;
              const isExpiring = new Date(attrs.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{fontWeight: 600, color: 'white'}}>{attrs.name}</div>
                    <div style={{fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-dim)'}}>{c.id}</div>
                  </td>
                  <td><span className="platform-tag">{attrs.certificateType.replace('_', ' ')}</span></td>
                  <td>{attrs.platform}</td>
                  <td>
                    <span style={{color: isExpiring ? 'var(--danger)' : 'var(--text-secondary)'}}>
                      {new Date(attrs.expirationDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <a href={`data:application/x-x509-ca-cert;base64,${attrs.certificateContent}`} download={`${attrs.name}.cer`} className="btn-outline btn-sm" style={{textDecoration: 'none'}}>
                      <Save size={14} /> Скачать .cer
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// PROFILES TAB
// -------------------------------------------------------------
const ProfilesTab = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('apple-developer-api', {
        body: { action: 'getProfiles' }
      });
      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);
      setProfiles(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfiles(); }, []);

  return (
    <div className="glass-card">
      <div className="module-controls" style={{padding: '24px', borderBottom: '1px solid var(--border-color)'}}>
        <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
          <FileBadge size={20} color="var(--accent-primary)" />
          Provisioning Profiles
        </h3>
        <button className="btn-outline" onClick={loadProfiles} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Обновить
        </button>
      </div>

      <div className="table-container">
        {error && <div style={{padding: '16px', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)'}}>{error}</div>}
        <table className="assets-table">
          <thead>
            <tr>
              <th>Название / Bundle ID</th>
              <th>Тип профиля</th>
              <th>Состояние</th>
              <th>Истекает</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && profiles.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px'}}><div className="loader"></div></td></tr>
            ) : profiles.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px', color: 'var(--text-dim)'}}>Профили не найдены.</td></tr>
            ) : profiles.map(p => {
              const attrs = p.attributes;
              const isExpiring = new Date(attrs.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{fontWeight: 600, color: 'white'}}>{attrs.name}</div>
                    <div style={{fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-dim)'}}>{p.id}</div>
                  </td>
                  <td><span className="platform-tag">{attrs.profileType.replace('_', ' ')}</span></td>
                  <td>
                    <span className={`status-pill ${attrs.profileState === 'ACTIVE' ? 'active' : 'revoked'}`}>
                      {attrs.profileState}
                    </span>
                  </td>
                  <td>
                    <span style={{color: isExpiring ? 'var(--danger)' : 'var(--text-secondary)'}}>
                      {new Date(attrs.expirationDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <a href={`data:application/octet-stream;base64,${attrs.profileContent}`} download={`${attrs.name}.mobileprovision`} className="btn-outline btn-sm" style={{textDecoration: 'none'}}>
                      <Save size={14} /> Скачать
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SETTINGS TAB
// -------------------------------------------------------------
const SettingsTab = () => {
  const [issuerId, setIssuerId] = useState('');
  const [keyId, setKeyId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('apple_developer_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single();
      
      if (!error && data) {
        setIssuerId(data.issuer_id || '');
        setKeyId(data.key_id || '');
        setPrivateKey(data.private_key || '');
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const { error } = await supabase
        .from('apple_developer_settings')
        .upsert({
          id: SETTINGS_ID,
          issuer_id: issuerId,
          key_id: keyId,
          private_key: privateKey
        }, { onConflict: 'id' });

      if (error) throw error;
      setSuccessMsg('Ключи успешно сохранены.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Ошибка при сохранении: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding: '32px'}}><div className="loader"></div></div>;

  return (
    <div className="glass-card" style={{padding: '24px', maxWidth: '600px'}}>
      <h3 style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <Key size={20} color="var(--accent-primary)" />
        Apple Connect API Credentials
      </h3>
      <p style={{color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.5'}}>
        Для интеграции с аккаунтом разработчика Apple необходимо выпустить ключ App Store Connect API. 
        Перейдите в App Store Connect &gt; Users and Access &gt; Keys. Ответьте на вопрос о доступе к Backend Edge Functions.
      </p>

      {successMsg && (
        <div style={{marginBottom: '16px', padding: '12px', background: 'rgba(19, 209, 107, 0.1)', color: '#13d16b', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <ShieldCheck size={16} /> {successMsg}
        </div>
      )}

      <div className="form-group">
        <label>Issuer ID</label>
        <input 
          type="text" 
          placeholder="Например: 69a6de7a-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
          value={issuerId} 
          onChange={(e) => setIssuerId(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label>Key ID</label>
        <input 
          type="text" 
          placeholder="Например: 8AXXXXXXX9" 
          value={keyId} 
          onChange={(e) => setKeyId(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label>Private Key (.p8 content)</label>
        <textarea 
          placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----" 
          rows={6}
          value={privateKey} 
          onChange={(e) => setPrivateKey(e.target.value)} 
          style={{fontFamily: 'monospace', fontSize: '12px'}}
        />
      </div>

      <button className="btn-primary" onClick={handleSave} disabled={saving} style={{marginTop: '12px'}}>
        <Save size={16} /> {saving ? 'Сохранение...' : 'Сохранить ключи'}
      </button>
    </div>
  );
};


// -------------------------------------------------------------
// MAIN COMPONENT (AppleManagement)
// -------------------------------------------------------------
const AppleManagement = () => {
  const [activeTab, setActiveTab] = useState('devices');

  const tabs = [
    { id: 'devices', label: 'Устройства (UDID)', icon: <Smartphone size={16} /> },
    { id: 'certs', label: 'Сертификаты', icon: <ShieldCheck size={16} /> },
    { id: 'profiles', label: 'Профили', icon: <FileBadge size={16} /> },
    { id: 'settings', label: 'Настройки аккаунта', icon: <Settings size={16} /> },
  ];

  return (
    <div className="assets-module">
      
      {/* Tabs Menu */}
      <div className="tabs-container" style={{marginBottom: '24px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px'}}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'var(--border-color)' : 'transparent',
              borderRadius: 'var(--radius-md)',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition)'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'devices' && <DevicesTab />}
        {activeTab === 'certs' && <CertificatesTab />}
        {activeTab === 'profiles' && <ProfilesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>

    </div>
  );
};

export default AppleManagement;
