import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { groupService, userService, chatService, socketService, globalChatService } from '@/services';
import api from '@/services/api';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import {
  Users,
  Calendar,
  Plus,
  Search,
  Eye,
  UsersRound,
  Layers,
  UserPlus,
  Mail,
  Link2,
  MessageCircle,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Pencil,
  Trash2,
  X as XIcon,
} from 'lucide-react';

const DEBOUNCE_MS = 400;

// ---------- Chat helpers ----------
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3b82f6&color=fff&name=';

const getSenderName = (sender) => {
  if (!sender) return 'Unknown';
  const fn = sender.first_name || '';
  const ln = sender.last_name || '';
  const full = `${fn} ${ln}`.trim();
  return full || sender.email || 'Unknown';
};

const getSenderAvatar = (sender) => {
  if (sender?.img_url) return sender.img_url;
  return `${DEFAULT_AVATAR}${encodeURIComponent(getSenderName(sender))}`;
};

const formatMessageTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatPreviewTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatDateLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
// -----------------------------------------------------------------------------

const DEFAULT_GROUP_IMAGE = 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop';

// Normalize API group to UI shape (accept common API field names)
const normalizeGroup = (g) => {
  if (!g || typeof g !== 'object') return null;
  
  // Handle image URL - if it's a relative path, add base URL
  let imageUrl = DEFAULT_GROUP_IMAGE;
  if (g.image_url) {
    imageUrl = g.image_url;
    // If it's a relative path, add the base URL
    if (imageUrl.startsWith('/uploads/')) {
      imageUrl = `${window.location.origin}${imageUrl}`;
    }
  } else if (g.image) {
    imageUrl = g.image;
  } else if (g.avatar) {
    imageUrl = g.avatar;
  }
  
  return {
    id: g.id ?? g.group_id ?? g.groupId,
    name: (g.name ?? g.group_name ?? g.groupName ?? '').toString(),
    description: (g.description ?? g.group_description ?? g.groupDescription ?? '').toString(),
    image: imageUrl,
    members: g.members ?? g.member_count ?? g.memberCount ?? 0,
    events: g.events ?? g.event_count ?? g.eventCount ?? 0,
    isJoined: g.isJoined ?? g.is_joined ?? false,
  };
};

// Normalize API user to { id, fullName, email, avatar } for display
const normalizeUser = (u) => {
  if (!u || typeof u !== 'object') return null;
  const id = u.id ?? u.user_id ?? u.userId;
  if (id == null) return null;
  const fullName = (u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.name || '').toString().trim() || '—';
  return {
    id,
    fullName,
    email: (u.email ?? '').toString(),
    avatar: u.avatar ?? u.image ?? u.image_url ?? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  };
};

const toGroupList = (data) => {
  if (data == null) return [];
  if (Array.isArray(data)) {
    return data.map(normalizeGroup).filter(Boolean);
  }
  if (typeof data !== 'object') return [];
  // API returns { groups: [ {...}, ... ] } — pick the array
  let list = data.groups ?? data.data ?? data.result ?? data.results ?? data.items ?? data.content;
  if (!Array.isArray(list) && list && typeof list === 'object') {
    list = list.groups ?? list.data ?? list.results ?? list.items ?? list.content ?? Object.values(list).find((v) => Array.isArray(v));
  }
  if (!Array.isArray(list)) {
    list = list && typeof list === 'object' && (list.id != null || list.group_id != null) ? [list] : [];
  }
  const arr = Array.isArray(list) ? list : [];
  return arr.map(normalizeGroup).filter(Boolean);
};

// Organization Required Modal
const OrganizationRequiredModal = ({ isOpen, onClose, onRegister }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Organization Required</h3>
          <p className="text-gray-500 mb-8">
            You need to register as an organization to create groups. Join as an organizer to unlock this feature and start building your community!
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onRegister}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
            >
              Register Organization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const organizationId = user?.organization_id ?? user?.organizationId ?? user?.organization?.id ?? null;
  // Same rule as DashboardLayout: only users linked to an organization can manage/create groups
  const isOrganizer = !!organizationId;

  const [activeTab, setActiveTab] = useState('all');
  const [showOrgRequiredModal, setShowOrgRequiredModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState(''); // 'uploading' | 'creating' | ''
  const [error, setError] = useState(null);

  // Form state for creating group
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [groupImagePreview, setGroupImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form state for updating group
  const [updateGroupName, setUpdateGroupName] = useState('');
  const [updateGroupDescription, setUpdateGroupDescription] = useState('');
  const [updateGroupImage, setUpdateGroupImage] = useState(null);
  const [updateGroupImagePreview, setUpdateGroupImagePreview] = useState(null);
  const [isUpdateDragging, setIsUpdateDragging] = useState(false);
  const [selectedGroupForUpdate, setSelectedGroupForUpdate] = useState(null);

  // Invite User states
  const [inviteSubTab, setInviteSubTab] = useState('user');
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchDebounceRef = useRef(null);
  // Email invitation search (same pattern as user search)
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [foundUsersByEmail, setFoundUsersByEmail] = useState([]);
  const [emailSearchLoading, setEmailSearchLoading] = useState(false);
  const emailSearchDebounceRef = useRef(null);

  // Invite Link states
  const [inviteMaxUses, setInviteMaxUses] = useState(10);
  const [inviteExpiresIn, setInviteExpiresIn] = useState(30); // days
  const [inviteMessage, setInviteMessage] = useState('Join our awesome group!');
  
  // Custom dropdown state
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null); // Store invite link information
  const [inviteInfoLoading, setInviteInfoLoading] = useState(false);
  const [latestInviteLinks, setLatestInviteLinks] = useState([]); // Store latest invite links for organization
  const [, setLatestInviteLinksLoading] = useState(false);
  const [checkingExistingLink, setCheckingExistingLink] = useState(false); // Loading state for checking existing links

  // Chat tab states
  const currentUserId = user?.id ?? user?.user_id ?? null;
  const [selectedChatGroup, setSelectedChatGroup] = useState(null);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [nextBefore, setNextBefore] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingSaving, setEditingSaving] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const joinedGroupIdRef = useRef(null);
  const activeChatGroupIdRef = useRef(null);
  const messageInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Global Chat states
  const [globalMessages, setGlobalMessages] = useState([]);
  const [globalMessagesLoading, setGlobalMessagesLoading] = useState(false);
  const [globalHasMoreMessages, setGlobalHasMoreMessages] = useState(false);
  const [globalNextBefore, setGlobalNextBefore] = useState(null);
  const [globalSendingMessage, setGlobalSendingMessage] = useState(false);
  const [globalMessageInput, setGlobalMessageInput] = useState('');
  const [globalPendingFiles, setGlobalPendingFiles] = useState([]);
  const [globalShowEmojiPicker, setGlobalShowEmojiPicker] = useState(false);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [globalOpenMessageMenuId, setGlobalOpenMessageMenuId] = useState(null);
  const [globalEditingMessageId, setGlobalEditingMessageId] = useState(null);
  const [globalEditingContent, setGlobalEditingContent] = useState('');
  const [globalEditingSaving, setGlobalEditingSaving] = useState(false);
  const [globalDeletingMessageId, setGlobalDeletingMessageId] = useState(null);
  const globalMessagesEndRef = useRef(null);
  const globalMessagesScrollRef = useRef(null);
  const globalFileInputRef = useRef(null);
  const globalEmojiPickerRef = useRef(null);

  // Event creation state
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [selectedGroupIdForEvent, setSelectedGroupIdForEvent] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventShortDescription, setEventShortDescription] = useState('');
  const [eventLongDescription, setEventLongDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventFullAddress, setEventFullAddress] = useState('');
  const [eventCapacity, setEventCapacity] = useState('');
  const [eventIsPublic, setEventIsPublic] = useState(false);
  const [createEventLoading, setCreateEventLoading] = useState(false);

  useEffect(() => {
    fetchGroupsData();
  }, [organizationId]);

  // Redirect non-organizers away from restricted tabs
  useEffect(() => {
    if (!isOrganizer && (activeTab === 'my' || activeTab === 'invite')) {
      setActiveTab('all');
    }
  }, [isOrganizer, activeTab]);

  // Debounced user search: call API only when user stops typing
  useEffect(() => {
    const term = userSearchTerm.trim();
    if (!term) {
      setFoundUsers([]);
      setUserSearchLoading(false);
      return;
    }
    if (userSearchDebounceRef.current) {
      clearTimeout(userSearchDebounceRef.current);
    }
    userSearchDebounceRef.current = setTimeout(async () => {
      userSearchDebounceRef.current = null;
      setUserSearchLoading(true);
      try {
        const data = await userService.searchUsers(term);
        const list = Array.isArray(data) ? data : (data?.users ?? data?.data ?? data?.results ?? []);
        setFoundUsers(list.map(normalizeUser).filter(Boolean));
      } catch (err) {
        console.error('User search failed:', err);
        setFoundUsers([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (userSearchDebounceRef.current) {
        clearTimeout(userSearchDebounceRef.current);
      }
    };
  }, [userSearchTerm]);

  // Debounced email search for Email Invitation tab
  useEffect(() => {
    const term = emailSearchTerm.trim();
    if (!term) {
      setFoundUsersByEmail([]);
      setEmailSearchLoading(false);
      return;
    }
    if (emailSearchDebounceRef.current) {
      clearTimeout(emailSearchDebounceRef.current);
    }
    emailSearchDebounceRef.current = setTimeout(async () => {
      emailSearchDebounceRef.current = null;
      setEmailSearchLoading(true);
      try {
        const data = await userService.searchUsersByEmail(term);
        const list = Array.isArray(data) ? data : (data?.data ?? data?.users ?? data?.results ?? []);
        setFoundUsersByEmail(list.map(normalizeUser).filter(Boolean));
      } catch (err) {
        console.error('Email search failed:', err);
        setFoundUsersByEmail([]);
      } finally {
        setEmailSearchLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (emailSearchDebounceRef.current) {
        clearTimeout(emailSearchDebounceRef.current);
      }
    };
  }, [emailSearchTerm]);

  const fetchGroupsData = async () => {
    setLoading(true);
    setError(null);

    const [allResult, orgResult, invitationsResult] = await Promise.allSettled([
      groupService.getAllGroups(),
      groupService.getGroupsByOrganization(),
      api.get('/invitations/received?status=PENDING'),
    ]);

    const allData = allResult.status === 'fulfilled' ? allResult.value : null;
    const byOrgData = orgResult.status === 'fulfilled' ? orgResult.value : null;
    const invitationsData = invitationsResult.status === 'fulfilled' ? invitationsResult.value : null;

    if (allResult.status === 'rejected') {
      console.error('Get all groups failed:', allResult.reason);
      setError(allResult.reason?.response?.data?.message || allResult.reason?.message || 'Failed to load all groups');
    }
    if (orgResult.status === 'rejected') {
      console.warn('Get groups by organization failed:', orgResult.reason?.response?.status, orgResult.reason?.message);
    }
    if (invitationsResult.status === 'rejected') {
      console.warn('Get invitations failed:', invitationsResult.reason?.response?.status, invitationsResult.reason?.message);
    }

    setGroups(toGroupList(allData));
    setMyGroups(toGroupList(byOrgData ?? []));
    
    // Process invitations data
    const invitationsList = invitationsData?.data?.data || [];
    setInvitations(invitationsList);
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim()) return;
    try {
      setCreateLoading(true);
      setError(null);
      
      let imageUrl = null;
      
      // Step 1: Upload image if one is selected
      if (groupImage) {
        console.log('Starting image upload...', groupImage);
        setUploadStep('uploading');
        const imageFormData = new FormData();
        imageFormData.append('file', groupImage);
        
        try {
          const uploadResponse = await api.post('/upload/single', imageFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log('Upload response:', uploadResponse.data);
          console.log('Upload response structure:', JSON.stringify(uploadResponse.data, null, 2));
          
          if (uploadResponse.data && uploadResponse.data.data && uploadResponse.data.data.file) {
            imageUrl = uploadResponse.data.data.file.file_url;
            console.log('Extracted image URL:', imageUrl);
          } else {
            console.error('Unexpected upload response structure:', uploadResponse.data);
            throw new Error('Invalid upload response structure');
          }
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          console.error('Upload error response:', uploadError.response?.data);
          throw uploadError;
        }
      } else {
        console.log('No image selected for upload');
      }
      
      // Step 2: Create group with image URL
      setUploadStep('creating');
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
      };
      
      if (imageUrl) {
        groupData.image_url = imageUrl;
        console.log('Including image_url in group data:', imageUrl);
      } else {
        console.log('No image URL to include in group data');
        // TEMPORARY: For testing, add a placeholder image URL
        // groupData.image_url = 'https://via.placeholder.com/400x200.png?text=Test+Image';
      }
      
      console.log('Final group data being sent:', groupData);
      
      const createResponse = await groupService.createGroup(groupData);
      console.log('Group creation response:', createResponse.data);
      
      // Reset form
      setGroupName('');
      setGroupDescription('');
      setGroupImage(null);
      setGroupImagePreview(null);
      setUploadStep('');
      setShowCreateModal(false);
      await fetchGroupsData();
    } catch (err) {
      console.error('Error creating group:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to create group');
      setUploadStep('');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!updateGroupName.trim() || !updateGroupDescription.trim() || !selectedGroupForUpdate) return;
    
    try {
      setUpdateLoading(true);
      setError(null);
      
      let imageUrl = selectedGroupForUpdate.image; // Keep existing image URL by default
      
      // Step 1: Upload new image if one is selected
      if (updateGroupImage) {
        console.log('Starting image upload for update...', updateGroupImage);
        setUploadStep('uploading');
        const imageFormData = new FormData();
        imageFormData.append('file', updateGroupImage);
        
        try {
          const uploadResponse = await api.post('/upload/single', imageFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log('Upload response:', uploadResponse.data);
          
          if (uploadResponse.data && uploadResponse.data.data && uploadResponse.data.data.file) {
            imageUrl = uploadResponse.data.data.file.file_url;
            console.log('Extracted new image URL:', imageUrl);
          } else {
            console.error('Unexpected upload response structure:', uploadResponse.data);
            throw new Error('Invalid upload response structure');
          }
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          throw uploadError;
        }
      }
      
      // Step 2: Update group with new data
      setUploadStep('creating');
      const groupData = {
        name: updateGroupName.trim(),
        description: updateGroupDescription.trim(),
      };
      
      if (imageUrl && imageUrl !== selectedGroupForUpdate.image) {
        groupData.image_url = imageUrl;
        console.log('Including new image_url in group data:', imageUrl);
      }
      
      console.log('Final group data being sent for update:', groupData);
      
      const updateResponse = await groupService.updateGroup(selectedGroupForUpdate.id, groupData);
      console.log('Group update response:', updateResponse.data);
      
      // Reset form and close modal
      resetUpdateGroupForm();
      setShowUpdateModal(false);
      await fetchGroupsData();
      
      alert('Group updated successfully!');
    } catch (err) {
      console.error('Error updating group:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to update group');
      setUploadStep('');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setGroupImage(null);
    setGroupImagePreview(null);
  };

  const resetCreateGroupForm = () => {
    setGroupName('');
    setGroupDescription('');
    setGroupImage(null);
    setGroupImagePreview(null);
    setUploadStep('');
    setError(null);
  };

  const resetUpdateGroupForm = () => {
    setUpdateGroupName('');
    setUpdateGroupDescription('');
    setUpdateGroupImage(null);
    setUpdateGroupImagePreview(null);
    setSelectedGroupForUpdate(null);
    setUploadStep('');
    setError(null);
  };

  const handleUpdateImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setUpdateGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdateGroupImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateRemoveImage = () => {
    setUpdateGroupImage(null);
    setUpdateGroupImagePreview(null);
  };

  const handleUpdateDragOver = (e) => {
    e.preventDefault();
    setIsUpdateDragging(true);
  };

  const handleUpdateDragLeave = (e) => {
    e.preventDefault();
    setIsUpdateDragging(false);
  };

  const handleUpdateDrop = (e) => {
    e.preventDefault();
    setIsUpdateDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setUpdateGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdateGroupImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditGroup = (group) => {
    setSelectedGroupForUpdate(group);
    setUpdateGroupName(group.name);
    setUpdateGroupDescription(group.description);
    setUpdateGroupImagePreview(group.image);
    setShowUpdateModal(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async () => {
    if (!selectedGroupIdForEvent || !eventTitle.trim() || !eventShortDescription.trim()) return;
    
    try {
      setCreateEventLoading(true);
      setError(null);
      
      console.log('Creating event with organizationId:', organizationId); // Debug log
      console.log('Selected group for event:', selectedGroupIdForEvent); // Debug log
      
      await groupService.createGroupEvent(selectedGroupIdForEvent, {
        title: eventTitle.trim(),
        shortDescription: eventShortDescription.trim(),
        longDescription: eventLongDescription.trim(),
        category: eventCategory || 'General',
        startTime: eventStartTime,
        endTime: eventEndTime,
        location: eventLocation.trim(),
        fullAddress: eventFullAddress.trim(),
        capacity: parseInt(eventCapacity) || 50,
        isPublic: eventIsPublic,
      });
      
      // Reset form
      setEventTitle('');
      setEventShortDescription('');
      setEventLongDescription('');
      setEventCategory('');
      setEventStartTime('');
      setEventEndTime('');
      setEventLocation('');
      setEventFullAddress('');
      setEventCapacity('');
      setEventIsPublic(false);
      setSelectedGroupIdForEvent('');
      setShowCreateEventModal(false);
      
      // Refresh groups to get updated event count
      await fetchGroupsData();
      
      alert('Event created successfully!');
    } catch (err) {
      console.error('Error creating event:', err);
      console.error('Error response:', err.response?.data); // Debug log
      setError(err.response?.data?.message || err.message || 'Failed to create event');
    } finally {
      setCreateEventLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/accept`);
      console.log('Invitation accepted successfully:', response.data);
      
      // Remove from pending invitations
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      // Refresh groups data to include the new group
      await fetchGroupsData();
      
      alert('Invitation accepted! You have joined the group.');
      
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert(`Failed to accept invitation: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/reject`);
      console.log('Invitation rejected successfully:', response.data);
      
      // Remove from pending invitations
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      alert('Invitation rejected.');
      
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      alert(`Failed to reject invitation: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const handleInviteUser = async (userId) => {
    if (!selectedGroupForInvite || !userId) return;
    
    try {
      const response = await api.post('/invitations/group/invite', {
        group_id: selectedGroupForInvite,
        user_id: userId,
        role: 'member',
        message: 'Join our group!'
      });

      console.log('User invited successfully:', response.data);
      
      // You could add a success notification here
      alert('User invited successfully!');
      
      // Optionally refresh the user list or update UI state
      // For now, just log the success
      
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert(`Failed to invite user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDirectEmailInvite = async (email) => {
    if (!selectedGroupForInvite || !email) return;
    
    try {
      const response = await api.post('/invitations/group/invite-by-email', {
        group_id: selectedGroupForInvite,
        email: email,
        role: 'member',
        message: 'Join our group!'
      });

      console.log('Email invitation sent successfully:', response.data);
      
      alert('Email invitation sent successfully!');
      
    } catch (error) {
      console.error('Failed to send email invitation:', error);
      alert(`Failed to send email invitation: ${error.response?.data?.message || error.message}`);
    }
  };


  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      // You could add a toast notification here
    }
  };

  const handleUserSearch = (term) => {
    setUserSearchTerm(term);
  };

  const generateInviteLink = async () => {
    if (!selectedGroupForInvite) return;
    
    try {
      setError(null);
      const response = await api.post(`/groups/${selectedGroupForInvite}/invite-links`, {
        max_uses: inviteMaxUses,
        expires_at: new Date(Date.now() + inviteExpiresIn * 24 * 60 * 60 * 1000).toISOString(), // Convert days to milliseconds
        message: inviteMessage
      });
      
      const inviteUrl = response.data.data.inviteUrl;
      setInviteLink(inviteUrl);
      
      // Extract token from the invite URL to fetch invite info
      const token = inviteUrl.split('/').pop();
      await fetchInviteInfo(token);
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(inviteUrl);
      alert('Invite link generated and copied to clipboard!');
      
    } catch (error) {
      console.error('Failed to generate invite link:', error);
      setError(error.response?.data?.message || error.message || 'Failed to generate invite link');
    }
  };

  const fetchInviteInfo = async (token) => {
    if (!token) return;
    
    try {
      setInviteInfoLoading(true);
      const response = await groupService.getInviteInfo(token);
      setInviteInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch invite info:', error);
      // Don't set error here as it's not critical
    } finally {
      setInviteInfoLoading(false);
    }
  };

  const checkExistingInviteLink = async (groupId) => {
    if (!groupId) return;
    
    try {
      setCheckingExistingLink(true);
      // Fetch latest invite links for the organization
      const response = await groupService.getLatestInviteLinks();
      const inviteLinks = response.data.invite_links || [];
      setLatestInviteLinks(inviteLinks);
      
      // Find if there's an existing invite link for this group
      const existingLink = inviteLinks.find(link => link.group_id === groupId);
      if (existingLink) {
        setInviteLink(existingLink.invite_url);
        setInviteInfo({
          invite_link: existingLink.invite_link,
          expired_date: existingLink.expired_date,
          number_of_uses: existingLink.number_of_uses,
          max_uses: existingLink.max_uses,
          message: existingLink.message
        });
      } else {
        // Clear existing invite info if no link found for this group
        setInviteInfo(null);
        setInviteLink('');
      }
    } catch (error) {
      console.error('Failed to check existing invite link:', error);
      setInviteInfo(null);
      setInviteLink('');
      setLatestInviteLinks([]);
    } finally {
      setCheckingExistingLink(false);
    }
  };

  const fetchLatestInviteLinks = async () => {
    try {
      setLatestInviteLinksLoading(true);
      const response = await groupService.getLatestInviteLinks();
      setLatestInviteLinks(response.data.invite_links || []);
    } catch (error) {
      console.error('Failed to fetch latest invite links:', error);
      setLatestInviteLinks([]);
    } finally {
      setLatestInviteLinksLoading(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');
  const displayedGroups = activeTab === 'all' ? filteredGroups : activeTab === 'my' ? myGroups : [];

  // Chat tab — filter conversations by search term
  const chatGroups = conversations.filter((g) =>
    (g.name || '').toLowerCase().includes(chatSearchTerm.toLowerCase())
  );

  // Fetch conversations when entering the Chat tab
  const fetchConversations = async () => {
    try {
      setConversationsLoading(true);
      const res = await chatService.getConversations();
      const list = res?.data?.conversations || [];
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setConversations([]);
      return [];
    } finally {
      setConversationsLoading(false);
    }
  };

  // Fetch conversations on mount (for badge total) and whenever Chat tab is opened
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistent socket listener for sidebar updates (works for ALL groups,
  // even when their chat window isn't open). The user is auto-joined to
  // their personal user:<id> room on socket connection.
  useEffect(() => {
    const socket = socketService.connect();
    if (!socket) return;

    const handleConversationUpdate = (payload) => {
      if (!payload?.group_id) return;
      const activeId = activeChatGroupIdRef.current;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === payload.group_id);
        const merged = exists
          ? prev.map((c) => {
              if (c.id !== payload.group_id) return c;
              const isViewing = activeId === payload.group_id;
              return {
                ...c,
                last_message: payload.last_message
                  ? { ...payload.last_message, is_own: payload.is_own }
                  : c.last_message,
                unread_count:
                  payload.is_own || isViewing
                    ? c.unread_count
                    : (c.unread_count || 0) + 1,
              };
            })
          : prev;

        // Move the updated conversation to the top by latest message time
        return [...merged].sort((a, b) => {
          const aTime = a.last_message?.created_at
            ? new Date(a.last_message.created_at).getTime()
            : 0;
          const bTime = b.last_message?.created_at
            ? new Date(b.last_message.created_at).getTime()
            : 0;
          return bTime - aTime;
        });
      });

      // If the update is for a group we don't yet have in the list
      // (e.g. just added to a new group), refetch conversations.
      setConversations((prev) => {
        if (!prev.some((c) => c.id === payload.group_id)) {
          fetchConversations();
        }
        return prev;
      });
    };

    socket.on('chat:conversation_update', handleConversationUpdate);
    return () => {
      socket.off('chat:conversation_update', handleConversationUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== 'chat') return;
    (async () => {
      const list = await fetchConversations();
      if (!selectedChatGroup && list.length > 0) {
        const first = list[0];
        setSelectedChatGroup(first);
        // Explicitly mark the auto-selected first group as read so the sender
        // sees ✓✓ in real-time even without an explicit click.
        try {
          await chatService.markAsRead(first.id);
          setConversations((prev) =>
            prev.map((c) => (c.id === first.id ? { ...c, unread_count: 0 } : c))
          );
          window.dispatchEvent(new CustomEvent('chat:group_marked_read', { detail: { group_id: first.id } }));
        } catch (err) {
          console.warn('Auto mark-as-read failed:', err?.response?.data?.message || err?.message || err);
        }
      } else if (selectedChatGroup?.id) {
        // Re-entering the chat tab with a group already selected — re-mark as read.
        try {
          await chatService.markAsRead(selectedChatGroup.id);
          setConversations((prev) =>
            prev.map((c) => (c.id === selectedChatGroup.id ? { ...c, unread_count: 0 } : c))
          );
          window.dispatchEvent(new CustomEvent('chat:group_marked_read', { detail: { group_id: selectedChatGroup.id } }));
        } catch (err) {
          console.warn('Re-enter mark-as-read failed:', err?.response?.data?.message || err?.message || err);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Sync unread count when FloatingChatWidget (or any other component) marks a group as read
  useEffect(() => {
    const handleExternalRead = (e) => {
      const groupId = e.detail?.group_id;
      if (!groupId) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === groupId ? { ...c, unread_count: 0 } : c))
      );
    };
    window.addEventListener('chat:group_marked_read', handleExternalRead);
    return () => window.removeEventListener('chat:group_marked_read', handleExternalRead);
  }, []);

  // Fetch messages whenever a group is selected
  const fetchMessages = async (groupId, { before } = {}) => {
    try {
      if (before) setLoadingMoreMessages(true);
      else setMessagesLoading(true);
      const res = await chatService.getMessages(groupId, { limit: 30, before });
      const list = res?.data?.messages || [];
      const pagination = res?.data?.pagination || {};
      setHasMoreMessages(!!pagination.has_more);
      setNextBefore(pagination.next_before || null);
      if (before) {
        // Prepend older messages
        setChatMessages((prev) => [...list, ...prev]);
      } else {
        setChatMessages(list);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      if (!before) setChatMessages([]);
    } finally {
      setMessagesLoading(false);
      setLoadingMoreMessages(false);
    }
  };

  // Fetch global chat messages
  const fetchGlobalMessages = async ({ before } = {}) => {
    try {
      if (before) {
        // For pagination
        const res = await globalChatService.getMessages({ limit: 30, before });
        console.log('Global chat response (pagination):', res);
        // API returns { data: [...], pagination: {...} }
        const list = res?.data || [];
        const pagination = res?.pagination || {};
        setGlobalHasMoreMessages(!!pagination.has_more);
        setGlobalNextBefore(pagination.next_before || null);
        setGlobalMessages((prev) => [...list, ...prev]);
      } else {
        setGlobalMessagesLoading(true);
        const res = await globalChatService.getMessages({ limit: 30 });
        console.log('Global chat response:', res);
        // API returns { data: [...], pagination: {...} }
        const list = res?.data || [];
        const pagination = res?.pagination || {};
        console.log('Extracted messages:', list);
        setGlobalHasMoreMessages(!!pagination.has_more);
        setGlobalNextBefore(pagination.next_before || null);
        setGlobalMessages(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch global messages:', err);
      if (!before) setGlobalMessages([]);
    } finally {
      setGlobalMessagesLoading(false);
    }
  };

  // Fetch global messages when entering Global Chat tab
  useEffect(() => {
    if (activeTab !== 'global') return;
    let cancelled = false;

    (async () => {
      await fetchGlobalMessages();
      if (cancelled) return;

      // Mark all global messages as read (run in background, don't block UI)
      globalChatService.markAllRead()
        .then(() => setGlobalUnreadCount(0))
        .catch((err) => {
          console.warn('Failed to mark global messages as read:', err?.response?.data?.message || err?.message || err);
        });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Auto-scroll to bottom when global messages change (only when new messages added, not on tab switch)
  useEffect(() => {
    if (globalMessagesEndRef.current && activeTab === 'global') {
      globalMessagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalMessages.length]);

  useEffect(() => {
    activeChatGroupIdRef.current = selectedChatGroup?.id || null;
    if (!selectedChatGroup?.id) {
      setChatMessages([]);
      setHasMoreMessages(false);
      setNextBefore(null);
      return;
    }
    const groupId = selectedChatGroup.id;
    let cancelled = false;

    (async () => {
      // 1. Load chat history
      await fetchMessages(groupId);
      if (cancelled) return;

      // 2. Mark all messages read on the server
      try {
        await chatService.markAsRead(groupId);
        window.dispatchEvent(new CustomEvent('chat:group_marked_read', { detail: { group_id: groupId } }));
      } catch (err) {
        console.warn('Failed to mark messages as read:', err?.response?.data?.message || err?.message || err);
      }
      if (cancelled) return;

      // 3. Reset unread count locally in the sidebar
      setConversations((prev) =>
        prev.map((c) => (c.id === groupId ? { ...c, unread_count: 0 } : c))
      );
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatGroup?.id]);

  // Auto-scroll to bottom when messages change (only on initial load / new message, not pagination)
  useEffect(() => {
    if (!loadingMoreMessages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages.length, selectedChatGroup?.id]);

  // Socket: connect, join the active group room, and listen for events
  useEffect(() => {
    if (activeTab !== 'chat' || !selectedChatGroup?.id) return;

    const socket = socketService.connect();
    if (!socket) return;

    const groupId = selectedChatGroup.id;

    const join = () => {
      socketService.joinGroup(groupId);
      joinedGroupIdRef.current = groupId;
    };

    if (socket.connected) join();
    else socket.once('connect', join);

    const handleNewMessage = (msg) => {
      // Sidebar updates are handled by chat:conversation_update.
      // Here we only append to the open chat window.
      if (!msg || msg.group_id !== groupId) return;
      setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      // Auto mark-as-read so the sender's ✓✓ updates in real-time
      if (msg.sender?.id && msg.sender.id !== currentUserId) {
        chatService.markAsRead(groupId).then(() => {
          window.dispatchEvent(new CustomEvent('chat:group_marked_read', { detail: { group_id: groupId } }));
        }).catch(() => {});
      }
    };

    const handleEdited = (msg) => {
      if (!msg || msg.group_id !== groupId) return;
      setChatMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };

    const handleDeleted = ({ id }) => {
      if (!id) return;
      setChatMessages((prev) => prev.filter((m) => m.id !== id));
    };

    // Real-time read receipts
    // Bulk: when a member calls markAsRead on a group
    // Backend emits 'chat:group_read' with payload: { group_id, user_id, read_at, message_ids?: string[] }
    const handleMessagesRead = (payload) => {
      if (!payload || payload.group_id !== groupId) return;
      const { user_id, read_at, message_ids } = payload;
      if (!user_id) return;
      const readAt = read_at || new Date().toISOString();
      setChatMessages((prev) =>
        prev.map((m) => {
          // If a specific list of message_ids is provided, only update those.
          // Otherwise, mark every message in the group as read by this user.
          const inScope = !message_ids || message_ids.includes(m.id);
          if (!inScope) return m;
          const already = (m.read_by || []).some((r) => r.user_id === user_id);
          if (already) return m;
          const newReadBy = [...(m.read_by || []), { user_id, read_at: readAt }];
          return {
            ...m,
            read_by: newReadBy,
            read_count: (m.read_count ?? newReadBy.length - 1) + 1,
          };
        })
      );
    };

    // Per-message variant (in case backend emits granular events)
    // Payload (expected): { group_id, message_id, user_id, read_at }
    const handleMessageRead = (payload) => {
      if (!payload || payload.group_id !== groupId) return;
      const { message_id, user_id, read_at } = payload;
      if (!message_id || !user_id) return;
      setChatMessages((prev) =>
        prev.map((m) => {
          if (m.id !== message_id) return m;
          const already = (m.read_by || []).some((r) => r.user_id === user_id);
          if (already) return m;
          const newReadBy = [
            ...(m.read_by || []),
            { user_id, read_at: read_at || new Date().toISOString() },
          ];
          return {
            ...m,
            read_by: newReadBy,
            read_count: (m.read_count ?? newReadBy.length - 1) + 1,
          };
        })
      );
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:message_edited', handleEdited);
    socket.on('chat:message_deleted', handleDeleted);
    socket.on('chat:group_read', handleMessagesRead);
    // Backwards-compat: some backends emit this name
    socket.on('chat:messages_read', handleMessagesRead);
    socket.on('chat:message_read', handleMessageRead);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:message_edited', handleEdited);
      socket.off('chat:message_deleted', handleDeleted);
      socket.off('chat:group_read', handleMessagesRead);
      socket.off('chat:messages_read', handleMessagesRead);
      socket.off('chat:message_read', handleMessageRead);
      socket.off('connect', join);
      socketService.leaveGroup(groupId);
      joinedGroupIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedChatGroup?.id, currentUserId]);

  // Global Chat: Socket connection and event listeners
  useEffect(() => {
    if (activeTab !== 'global') return;

    const socket = socketService.connect();
    if (!socket) return;

    // Join global chat room
    const joinGlobal = () => {
      socketService.joinGroup('global');
    };

    if (socket.connected) joinGlobal();
    else socket.once('connect', joinGlobal);

    const handleGlobalNewMessage = (msg) => {
      if (!msg) return;
      setGlobalMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      // Auto mark-as-read so the sender's ✓✓ updates in real-time
      if (msg.sender?.id && msg.sender.id !== currentUserId) {
        globalChatService.markAllRead().catch(() => {});
      }
    };

    const handleGlobalEdited = (msg) => {
      if (!msg) return;
      setGlobalMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };

    const handleGlobalDeleted = ({ id }) => {
      if (!id) return;
      setGlobalMessages((prev) => prev.filter((m) => m.id !== id));
    };

    // Real-time read receipts for global chat
    const handleGlobalRead = (payload) => {
      if (!payload) return;
      const { user_id, read_at, message_ids } = payload;
      if (!user_id) return;
      const readAt = read_at || new Date().toISOString();
      setGlobalMessages((prev) =>
        prev.map((m) => {
          const inScope = !message_ids || message_ids.includes(m.id);
          if (!inScope) return m;
          const already = (m.read_by || []).some((r) => r.user_id === user_id);
          if (already) return m;
          const newReadBy = [...(m.read_by || []), { user_id, read_at: readAt }];
          return {
            ...m,
            read_by: newReadBy,
            read_count: (m.read_count ?? newReadBy.length - 1) + 1,
          };
        })
      );
    };

    const handleGlobalMessageRead = (payload) => {
      if (!payload) return;
      const { message_id, user_id, read_at } = payload;
      if (!message_id || !user_id) return;
      setGlobalMessages((prev) =>
        prev.map((m) => {
          if (m.id !== message_id) return m;
          const already = (m.read_by || []).some((r) => r.user_id === user_id);
          if (already) return m;
          const newReadBy = [...(m.read_by || []), { user_id, read_at: read_at || new Date().toISOString() }];
          return {
            ...m,
            read_by: newReadBy,
            read_count: (m.read_count ?? newReadBy.length - 1) + 1,
          };
        })
      );
    };

    socket.on('chat:new_message', handleGlobalNewMessage);
    socket.on('chat:message_edited', handleGlobalEdited);
    socket.on('chat:message_deleted', handleGlobalDeleted);
    socket.on('chat:global_read', handleGlobalRead);
    socket.on('chat:message_read', handleGlobalMessageRead);

    return () => {
      socket.off('chat:new_message', handleGlobalNewMessage);
      socket.off('chat:message_edited', handleGlobalEdited);
      socket.off('chat:message_deleted', handleGlobalDeleted);
      socket.off('chat:global_read', handleGlobalRead);
      socket.off('chat:message_read', handleGlobalMessageRead);
      socket.off('connect', joinGlobal);
      socketService.leaveGroup('global');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentUserId]);

  const handleLoadMoreMessages = () => {
    if (!selectedChatGroup?.id || !hasMoreMessages || !nextBefore || loadingMoreMessages) return;
    const scrollEl = messagesScrollRef.current;
    const prevScrollHeight = scrollEl?.scrollHeight || 0;
    fetchMessages(selectedChatGroup.id, { before: nextBefore }).then(() => {
      // Maintain scroll position after prepending
      requestAnimationFrame(() => {
        if (scrollEl) {
          const newScrollHeight = scrollEl.scrollHeight;
          scrollEl.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    });
  };

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleEmojiSelect = (emojiData) => {
    const emoji = emojiData?.emoji || '';
    if (!emoji) return;
    const input = messageInputRef.current;
    if (input) {
      const start = input.selectionStart ?? chatMessageInput.length;
      const end = input.selectionEnd ?? chatMessageInput.length;
      const next = chatMessageInput.slice(0, start) + emoji + chatMessageInput.slice(end);
      setChatMessageInput(next);
      // Restore cursor position after the inserted emoji
      requestAnimationFrame(() => {
        input.focus();
        const pos = start + emoji.length;
        input.setSelectionRange(pos, pos);
      });
    } else {
      setChatMessageInput((prev) => prev + emoji);
    }
  };

  // Close emoji picker on outside click or Escape
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showEmojiPicker]);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const combined = [...pendingFiles, ...files].slice(0, 5);
    setPendingFiles(combined);
    e.target.value = '';
  };

  const removePendingFile = (idx) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Edit message handlers
  const handleStartEditMessage = (msg) => {
    setOpenMessageMenuId(null);
    setEditingMessageId(msg.id);
    setEditingContent(msg.content || '');
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEditMessage = async () => {
    if (!editingMessageId || !selectedChatGroup?.id) return;
    const text = editingContent.trim();
    if (!text) return;
    try {
      setEditingSaving(true);
      const res = await chatService.editMessage(selectedChatGroup.id, editingMessageId, text);
      const updated = res?.data?.message;
      if (updated) {
        setChatMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
      setEditingMessageId(null);
      setEditingContent('');
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(err?.response?.data?.message || 'Failed to edit message');
    } finally {
      setEditingSaving(false);
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId) => {
    if (!selectedChatGroup?.id) return;
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      setDeletingMessageId(messageId);
      setOpenMessageMenuId(null);
      await chatService.deleteMessage(selectedChatGroup.id, messageId);
      setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError(err?.response?.data?.message || 'Failed to delete message');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleSendChatMessage = async () => {
    const text = chatMessageInput.trim();
    if (!selectedChatGroup?.id) return;
    if (!text && pendingFiles.length === 0) return;
    if (sendingMessage) return;

    try {
      setSendingMessage(true);
      const res = await chatService.sendMessage(selectedChatGroup.id, {
        content: text,
        files: pendingFiles,
      });
      const newMsg = res?.data?.message;
      if (newMsg) {
        // Optimistically append (socket may also deliver it; dedup by id)
        setChatMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedChatGroup.id
              ? {
                  ...c,
                  last_message: {
                    id: newMsg.id,
                    content: newMsg.content,
                    message_type: newMsg.message_type,
                    created_at: newMsg.created_at,
                    sender_id: newMsg.sender?.id,
                    sender_name: getSenderName(newMsg.sender),
                    is_own: true,
                  },
                }
              : c
          )
        );
      }
      setChatMessageInput('');
      setPendingFiles([]);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Global Chat: Send message
  const handleSendGlobalMessage = async () => {
    const text = globalMessageInput.trim();
    if (!text && globalPendingFiles.length === 0) return;
    if (globalSendingMessage) return;

    try {
      setGlobalSendingMessage(true);
      const res = await globalChatService.sendMessage({
        content: text,
        files: globalPendingFiles,
      });
      const newMsg = res?.data?.message;
      if (newMsg) {
        // Optimistically append (socket may also deliver it; dedup by id)
        setGlobalMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      }
      setGlobalMessageInput('');
      setGlobalPendingFiles([]);
    } catch (err) {
      console.error('Failed to send global message:', err);
      alert(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setGlobalSendingMessage(false);
    }
  };

  // Global Chat: Edit message
  const handleStartEditGlobalMessage = (msg) => {
    setGlobalOpenMessageMenuId(null);
    setGlobalEditingMessageId(msg.id);
    setGlobalEditingContent(msg.content || '');
  };

  const handleCancelEditGlobalMessage = () => {
    setGlobalEditingMessageId(null);
    setGlobalEditingContent('');
  };

  const handleSaveEditGlobalMessage = async () => {
    if (!globalEditingMessageId) return;
    const text = globalEditingContent.trim();
    if (!text) return;
    try {
      setGlobalEditingSaving(true);
      const res = await globalChatService.editMessage(globalEditingMessageId, text);
      const updated = res?.data?.message;
      if (updated) {
        setGlobalMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
      setGlobalEditingMessageId(null);
      setGlobalEditingContent('');
    } catch (err) {
      console.error('Failed to edit global message:', err);
      alert(err.response?.data?.message || err.message || 'Failed to edit message');
    } finally {
      setGlobalEditingSaving(false);
    }
  };

  // Global Chat: Delete message
  const handleDeleteGlobalMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      setGlobalDeletingMessageId(messageId);
      setGlobalOpenMessageMenuId(null);
      await globalChatService.deleteMessage(messageId);
      setGlobalMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete global message:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete message');
    } finally {
      setGlobalDeletingMessageId(null);
    }
  };

  // Global Chat: File handling
  const handleGlobalFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (globalPendingFiles.length + files.length > 5) {
      alert('You can attach up to 5 files.');
      return;
    }
    const valid = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds 10MB limit.`);
        return false;
      }
      return true;
    });
    setGlobalPendingFiles((prev) => [...prev, ...valid]);
    if (globalFileInputRef.current) globalFileInputRef.current.value = '';
  };

  const handlePickGlobalFiles = () => {
    globalFileInputRef.current?.click();
  };

  const removeGlobalPendingFile = (idx) => {
    setGlobalPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Global Chat: Emoji picker
  const handleGlobalEmojiSelect = (emojiData) => {
    setGlobalMessageInput((prev) => prev + (emojiData?.emoji || ''));
    setGlobalShowEmojiPicker(false);
  };

  // Close global emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        globalEmojiPickerRef.current &&
        !globalEmojiPickerRef.current.contains(event.target) &&
        globalShowEmojiPicker
      ) {
        setGlobalShowEmojiPicker(false);
      }
    };
    if (globalShowEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [globalShowEmojiPicker]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between mb-6">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Dismiss">×</button>
          </div>
        )}

        {/* Hero Header */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
          <div className="bg-blue-600 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left - Title */}
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <UsersRound className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Groups</h1>
                  <p className="text-blue-100">Join communities and participate in group events</p>
                </div>
              </div>

              {/* Right - Create Button (organizers only) */}
              {isOrganizer && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Group</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="px-8 py-5 flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                <p className="text-sm text-gray-500">All Groups</p>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-100 rounded-xl">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{myGroups.length}</p>
                <p className="text-sm text-gray-500">My Groups</p>
              </div>
            </div>
            {pendingInvitations.length > 0 && (
              <>
                <div className="w-px h-12 bg-gray-200" />
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl relative">
                    <Mail className="w-5 h-5 text-amber-600" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{pendingInvitations.length}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{pendingInvitations.length}</p>
                    <p className="text-sm text-gray-500">Invitations</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          {/* Tab Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <Layers className="w-4 h-4" />
              All Groups
            </button>
            {isOrganizer && (
              <button
                onClick={() => setActiveTab('my')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'my'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <Users className="w-4 h-4" />
                My Groups
              </button>
            )}
            {isOrganizer && (
              <button
                onClick={() => setActiveTab('invite')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'invite'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Invite User
              </button>
            )}
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Chat
              {(() => {
                const total = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
                return total > 0 ? (
                  <span className="ml-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                    {total > 99 ? '99+' : total}
                  </span>
                ) : null;
              })()}
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'global'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Community Chat
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:min-h-[calc(100vh-18rem)] items-stretch">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
        {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex h-[calc(100vh-18rem)] min-h-[560px]">
          {/* Conversations Sidebar */}
          <div className={`${selectedChatGroup ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r border-gray-200 flex-col bg-white`}>
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Conversations
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={chatSearchTerm}
                  onChange={(e) => setChatSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : chatGroups.length === 0 ? (
                <div className="text-center p-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">No conversations</p>
                  <p className="text-xs text-gray-500">Join a group to start chatting</p>
                </div>
              ) : (
                chatGroups.map((group) => {
                  const isActive = selectedChatGroup?.id === group.id;
                  const lm = group.last_message;
                  const previewText = lm
                    ? `${lm.is_own ? 'You: ' : (lm.sender_name ? `${lm.sender_name.split(' ')[0]}: ` : '')}${lm.message_type === 'file' ? '📎 Attachment' : (lm.content || '')}`
                    : 'No messages yet';
                  const previewTime = lm ? formatPreviewTime(lm.created_at) : '';
                  const unread = group.unread_count || 0;
                  const avatarSrc = group.image_url || `${DEFAULT_AVATAR}${encodeURIComponent(group.name || 'G')}`;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedChatGroup(group)}
                      className={`w-full p-3 flex items-start gap-3 text-left transition-colors border-b border-gray-100 ${
                        isActive ? 'bg-blue-50 hover:bg-blue-50' : 'hover:bg-white'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={avatarSrc}
                          alt={group.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-semibold truncate text-sm ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                            {group.name}
                          </h4>
                          <span className="text-[11px] text-gray-500 flex-shrink-0">{previewTime}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={`text-xs truncate ${unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {previewText}
                          </p>
                          {unread > 0 && (
                            <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className={`${selectedChatGroup ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {!selectedChatGroup ? (
              conversationsLoading ? (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-500 max-w-sm">Choose a group from the sidebar to start chatting with members</p>
                </div>
              )
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setSelectedChatGroup(null)}
                      className="md:hidden p-1 -ml-1 text-gray-500 hover:text-gray-900"
                      title="Back"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <img
                      src={selectedChatGroup.image_url || `${DEFAULT_AVATAR}${encodeURIComponent(selectedChatGroup.name || 'G')}`}
                      alt={selectedChatGroup.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{selectedChatGroup.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                        {selectedChatGroup.member_count || 0} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Search messages">
                      <Search className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="More">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                  {hasMoreMessages && (
                    <div className="flex justify-center">
                      <button
                        onClick={handleLoadMoreMessages}
                        disabled={loadingMoreMessages}
                        className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        {loadingMoreMessages ? 'Loading…' : 'Load older messages'}
                      </button>
                    </div>
                  )}

                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-700">No messages yet</p>
                      <p className="text-xs text-gray-500">Be the first to say hello 👋</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isMe = msg.sender?.id === currentUserId;
                      const prev = chatMessages[idx - 1];
                      const showDateSep =
                        !prev ||
                        new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
                      const senderName = getSenderName(msg.sender);
                      const senderAvatar = getSenderAvatar(msg.sender);
                      return (
                        <div key={msg.id}>
                          {showDateSep && (
                            <div className="flex justify-center my-2">
                              <span className="px-3 py-1 bg-white text-xs font-medium text-gray-500 rounded-full shadow-sm border border-gray-200">
                                {formatDateLabel(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`group/msg flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                              <img
                                src={senderAvatar}
                                alt={senderName}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            {/* Action menu for own messages (left side) */}
                            {isMe && editingMessageId !== msg.id && (
                              <div className="relative self-center opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMessageMenuId(openMessageMenuId === msg.id ? null : msg.id);
                                  }}
                                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                                  title="Message options"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {openMessageMenuId === msg.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setOpenMessageMenuId(null)}
                                    />
                                    <div className="absolute right-full mr-1 top-1/2 -translate-y-1/2 z-20 w-32 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                      <button
                                        onClick={() => handleStartEditMessage(msg)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        disabled={deletingMessageId === msg.id}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            <div className={`max-w-[75%] sm:max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              {!isMe && (
                                <span className="text-xs font-medium text-gray-600 mb-1 ml-3">{senderName}</span>
                              )}
                              <div
                                className={`px-4 py-2 shadow-sm ${
                                  isMe
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-200'
                                }`}
                              >
                                {editingMessageId === msg.id ? (
                                  <div className="flex flex-col gap-2 min-w-[220px]">
                                    <textarea
                                      autoFocus
                                      value={editingContent}
                                      onChange={(e) => setEditingContent(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSaveEditMessage();
                                        } else if (e.key === 'Escape') {
                                          handleCancelEditMessage();
                                        }
                                      }}
                                      rows={2}
                                      className={`w-full resize-none rounded-lg px-2 py-1.5 text-sm outline-none ${
                                        isMe
                                          ? 'bg-blue-700/40 text-white placeholder-blue-100 border border-blue-300/40'
                                          : 'bg-gray-50 text-gray-900 border border-gray-200'
                                      }`}
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={handleCancelEditMessage}
                                        className={`p-1.5 rounded-lg ${
                                          isMe ? 'hover:bg-blue-700/40 text-white' : 'hover:bg-gray-100 text-gray-600'
                                        }`}
                                        title="Cancel (Esc)"
                                      >
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={handleSaveEditMessage}
                                        disabled={editingSaving || !editingContent.trim()}
                                        className={`p-1.5 rounded-lg disabled:opacity-50 ${
                                          isMe ? 'hover:bg-blue-700/40 text-white' : 'hover:bg-blue-50 text-blue-600'
                                        }`}
                                        title="Save (Enter)"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                <>
                                {msg.content && (
                                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {msg.content}
                                  </p>
                                )}
                                {msg.files && msg.files.length > 0 && (
                                  <div className={`${msg.content ? 'mt-2' : ''} space-y-2`}>
                                    {msg.files.map((file) => {
                                      const isImage = (file.file_type || '').startsWith('image/');
                                      if (isImage) {
                                        return (
                                          <a
                                            key={file.id}
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                          >
                                            <img
                                              src={file.file_url}
                                              alt={file.file_name}
                                              className="max-w-[260px] max-h-[260px] rounded-lg object-cover"
                                            />
                                          </a>
                                        );
                                      }
                                      return (
                                        <a
                                          key={file.id}
                                          href={file.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                                            isMe
                                              ? 'bg-blue-700/40 border-blue-400/40 hover:bg-blue-700/60'
                                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                          } transition-colors`}
                                        >
                                          <Paperclip className={`w-4 h-4 flex-shrink-0 ${isMe ? 'text-white' : 'text-gray-500'}`} />
                                          <div className="min-w-0">
                                            <p className={`text-xs font-medium truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>
                                              {file.file_name}
                                            </p>
                                            <p className={`text-[10px] ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                              {formatFileSize(file.file_size)}
                                            </p>
                                          </div>
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                                </>
                                )}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 ${isMe ? 'mr-1' : 'ml-3'}`}>
                                <span className="text-[11px] text-gray-400">{formatMessageTime(msg.created_at)}</span>
                                {msg.is_edited && (
                                  <span className="text-[11px] text-gray-400 italic">· edited</span>
                                )}
                                {isMe && (() => {
                                  const readByOthers = (msg.read_by || []).filter(
                                    (r) => r.user_id !== currentUserId
                                  ).length;
                                  return readByOthers > 0 ? (
                                    <CheckCheck
                                      className="w-3.5 h-3.5 text-blue-500"
                                      title={`Read by ${readByOthers}`}
                                    />
                                  ) : (
                                    <Check
                                      className="w-3.5 h-3.5 text-gray-400"
                                      title="Sent"
                                    />
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-200 bg-white">
                  {/* Pending files preview */}
                  {pendingFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pendingFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                          <span className="font-medium text-gray-800 max-w-[160px] truncate">{file.name}</span>
                          <span className="text-gray-500">{formatFileSize(file.size)}</span>
                          <button
                            onClick={() => removePendingFile(idx)}
                            className="text-gray-400 hover:text-red-500"
                            title="Remove"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFilesSelected}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                    />
                    <button
                      onClick={handlePickFiles}
                      className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Attach file"
                      disabled={pendingFiles.length >= 5}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        className={`p-2.5 rounded-lg transition-colors ${
                          showEmojiPicker
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        title="Emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl rounded-xl overflow-hidden">
                          <EmojiPicker
                            onEmojiClick={handleEmojiSelect}
                            theme={Theme.LIGHT}
                            emojiStyle={EmojiStyle.NATIVE}
                            width={320}
                            height={380}
                            searchPlaceholder="Search emoji..."
                            previewConfig={{ showPreview: false }}
                            skinTonesDisabled
                          />
                        </div>
                      )}
                    </div>
                    <textarea
                      ref={messageInputRef}
                      rows={1}
                      value={chatMessageInput}
                      onChange={(e) => setChatMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      placeholder={`Message ${selectedChatGroup.name}...`}
                      className="flex-1 resize-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all max-h-32"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={(!chatMessageInput.trim() && pendingFiles.length === 0) || sendingMessage}
                      className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/30"
                      title="Send"
                    >
                      {sendingMessage ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {activeTab === 'global' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex h-[calc(100vh-18rem)] min-h-[560px]">
          {/* Global Chat Panel */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Community Chat</h3>
                  <p className="text-xs text-gray-500">Connect with everyone</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={globalMessagesScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {globalMessagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : globalMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Welcome to Community Chat</h4>
                  <p className="text-sm max-w-sm">Connect with everyone across all organizations. Start typing to send a message.</p>
                </div>
              ) : (
                <>
                  {globalMessages.map((msg, idx) => {
                    const isMe = msg.sender?.id === currentUserId;
                    const showDate = idx === 0 || formatDateLabel(msg.created_at) !== formatDateLabel(globalMessages[idx - 1]?.created_at);
                    const isDeleted = msg.is_deleted;
                    const isEditing = globalEditingMessageId === msg.id;
                    const isDeleting = globalDeletingMessageId === msg.id;
                    const canEditDelete = isMe && !isDeleted;

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">
                              {formatDateLabel(msg.created_at)}
                            </div>
                          </div>
                        )}
                        <div className={`group flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <img
                            src={getSenderAvatar(msg.sender)}
                            alt={getSenderName(msg.sender)}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                          />
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-700">{getSenderName(msg.sender)}</span>
                              <span className="text-[11px] text-gray-400">{formatMessageTime(msg.created_at)}</span>
                              {msg.is_edited && !isDeleted && (
                                <span className="text-[10px] text-gray-400 italic">· edited</span>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="w-full min-w-[240px]">
                                <textarea
                                  rows={2}
                                  value={globalEditingContent}
                                  onChange={(e) => setGlobalEditingContent(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                  disabled={globalEditingSaving}
                                />
                                <div className="flex items-center justify-end gap-2 mt-2">
                                  <button
                                    onClick={handleCancelEditGlobalMessage}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    disabled={globalEditingSaving}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveEditGlobalMessage}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    disabled={globalEditingSaving || !globalEditingContent.trim()}
                                  >
                                    {globalEditingSaving ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`relative px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                                {isDeleted ? (
                                  <span className="italic opacity-60">This message was deleted</span>
                                ) : (
                                  <div className="whitespace-pre-wrap">{msg.content}</div>
                                )}

                                {/* Message Menu (kebab) */}
                                {canEditDelete && !isEditing && (
                                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => setGlobalOpenMessageMenuId(globalOpenMessageMenuId === msg.id ? null : msg.id)}
                                      className="p-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                                    </button>
                                    {globalOpenMessageMenuId === msg.id && (
                                      <div className={`absolute top-full right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-20 ${isMe ? 'right-0' : 'left-0'}`}>
                                        <button
                                          onClick={() => handleStartEditGlobalMessage(msg)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                                        >
                                          <Pencil className="w-4 h-4" />
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteGlobalMessage(msg.id)}
                                          disabled={isDeleting}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg disabled:opacity-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          {isDeleting ? 'Deleting...' : 'Delete'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Read receipts */}
                            {isMe && !isDeleted && (
                              <div className="flex items-center gap-1 mt-1">
                                {(msg.read_by || []).length > 0 ? (
                                  <>
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[10px] text-gray-400">
                                      {(msg.read_by || []).length} read
                                    </span>
                                  </>
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-gray-300" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={globalMessagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 bg-white">
              {/* Pending files preview */}
              {globalPendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {globalPendingFiles.map((file, idx) => (
                    <div
                      key={`global-${file.name}-${idx}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-medium text-gray-800 max-w-[160px] truncate">{file.name}</span>
                      <span className="text-gray-500">{formatFileSize(file.size)}</span>
                      <button
                        onClick={() => removeGlobalPendingFile(idx)}
                        className="text-gray-400 hover:text-red-500"
                        title="Remove"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={globalFileInputRef}
                  type="file"
                  multiple
                  onChange={handleGlobalFilesSelected}
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                />
                <button
                  onClick={handlePickGlobalFiles}
                  className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Attach file"
                  disabled={globalPendingFiles.length >= 5}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="relative" ref={globalEmojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setGlobalShowEmojiPicker((v) => !v)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      globalShowEmojiPicker
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    title="Emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {globalShowEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl rounded-xl overflow-hidden">
                      <EmojiPicker
                        onEmojiClick={handleGlobalEmojiSelect}
                        theme={Theme.LIGHT}
                        emojiStyle={EmojiStyle.NATIVE}
                        width={320}
                        height={380}
                        searchPlaceholder="Search emoji..."
                        previewConfig={{ showPreview: false }}
                        skinTonesDisabled
                      />
                    </div>
                  )}
                </div>
                <textarea
                  rows={1}
                  value={globalMessageInput}
                  onChange={(e) => setGlobalMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendGlobalMessage();
                    }
                  }}
                  placeholder="Message everyone..."
                  className="flex-1 resize-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all max-h-32"
                />
                <button
                  onClick={handleSendGlobalMessage}
                  disabled={(!globalMessageInput.trim() && globalPendingFiles.length === 0) || globalSendingMessage}
                  className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/30"
                  title="Send"
                >
                  {globalSendingMessage ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab !== 'chat' && activeTab !== 'global' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === 'my' && !organizationId && myGroups.length === 0 && !loading && (
              <div className="col-span-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-6 rounded-lg text-center">
                You need to be part of an organization to see your groups here.
              </div>
            )}
            {displayedGroups.map((group) => (
              <div key={group.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                {/* Group Image */}
                <div className="relative h-44 bg-gray-200 overflow-hidden">
                  <img 
                    src={group.image} 
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Stats on Image */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{group.members} members</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{group.events} events</span>
                    </div>
                  </div>
                </div>

                {/* Group Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">{group.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{group.description}</p>

                  <div className="space-y-2">
                    {isOrganizer && myGroups.some(g => g.id === group.id) && (
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-700 transition-all font-semibold text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Group</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewGroup(group.id)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Group</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {(activeTab === 'all' || activeTab === 'my') && displayedGroups.length === 0 && !loading && (
              <div className="col-span-2 bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {activeTab === 'my' ? 'No groups in your organization yet' : 'No groups found'}
                </h3>
                <p className="text-sm text-gray-500">
                  {searchTerm.trim()
                    ? 'Try another search keyword.'
                    : activeTab === 'my'
                      ? 'Create a group or wait for group data to appear here.'
                      : 'No group data available right now.'}
                </p>
              </div>
            )}
          </div>
        )}

          {/* Invite User Tab Content */}
          {activeTab === 'invite' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Invitations</h3>
              
              <div className="flex-1 overflow-y-auto">
              
              {/* Select Group Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span>Choose Group for Invitation</span>
                  </div>
                </label>
                
                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {selectedGroupForInvite ? (
                        <>
                          <img
                            src={myGroups.find(g => g.id === selectedGroupForInvite)?.image || DEFAULT_GROUP_IMAGE}
                            alt={myGroups.find(g => g.id === selectedGroupForInvite)?.name || 'Selected group'}
                            className="w-10 h-10 rounded-lg object-cover"
                            onError={(e) => { e.target.src = DEFAULT_GROUP_IMAGE; }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {myGroups.find(g => g.id === selectedGroupForInvite)?.name || 'Selected group'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {myGroups.find(g => g.id === selectedGroupForInvite)?.members || 0} members
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="text-gray-500">Select a group to invite users...</div>
                        </>
                      )}
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showGroupDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Options */}
                  {showGroupDropdown && (
                    <div className="absolute z-10 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {myGroups.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">No groups available</p>
                          <p className="text-xs text-gray-500">Create a group first to start inviting users</p>
                        </div>
                      ) : (
                        myGroups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => {
                              setSelectedGroupForInvite(group.id);
                              setShowGroupDropdown(false);
                              checkExistingInviteLink(group.id);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={group.image || DEFAULT_GROUP_IMAGE}
                                alt={group.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => { e.target.src = DEFAULT_GROUP_IMAGE; }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{group.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                  {group.members || 0} members
                                </div>
                              </div>
                              {selectedGroupForInvite === group.id && (
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selection Confirmation */}
                {selectedGroupForInvite && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                          Ready to invite users to <strong>{myGroups.find(g => g.id === selectedGroupForInvite)?.name || 'Selected group'}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-tabs */}
              <div className="flex space-x-8 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setInviteSubTab('user')}
                  className={`pb-4 px-1 text-sm font-medium transition-colors ${
                    inviteSubTab === 'user'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  User Invitation
                </button>
                <button
                  onClick={() => setInviteSubTab('email')}
                  className={`pb-4 px-1 text-sm font-medium transition-colors ${
                    inviteSubTab === 'email'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Email Invitation
                </button>
                <button
                  onClick={() => setInviteSubTab('link')}
                  className={`pb-4 px-1 text-sm font-medium transition-colors ${
                    inviteSubTab === 'link'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Invite Link
                </button>
              </div>

              {/* User Invitation Sub-tab */}
              {inviteSubTab === 'user' && (
                <div>
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by username"
                        value={userSearchTerm}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {userSearchLoading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Found Users */}
                  <div className="space-y-4">
                    {foundUsers.length === 0 && userSearchTerm.trim() && !userSearchLoading ? (
                      <p className="text-gray-500 text-center py-4">No users found</p>
                    ) : foundUsers.length === 0 && !userSearchTerm.trim() ? (
                      <p className="text-gray-500 text-center py-4">Start typing to search for users</p>
                    ) : foundUsers.length > 0 ? (
                      foundUsers.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{u.fullName}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(u.id)}
                            disabled={!selectedGroupForInvite}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Invite
                          </button>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              )}

              {/* Email Invitation Sub-tab */}
              {inviteSubTab === 'email' && (
                <div>
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by email"
                        value={emailSearchTerm}
                        onChange={(e) => setEmailSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {emailSearchLoading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Found Users by Email */}
                  <div className="space-y-4">
                    {foundUsersByEmail.length === 0 && emailSearchTerm.trim() && !emailSearchLoading ? (
                      <p className="text-gray-500 text-center py-4">No users found</p>
                    ) : foundUsersByEmail.length === 0 && !emailSearchTerm.trim() ? (
                      <p className="text-gray-500 text-center py-4">Start typing to search by email</p>
                    ) : foundUsersByEmail.length > 0 ? (
                      foundUsersByEmail.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{u.fullName}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(u.id)}
                            disabled={!selectedGroupForInvite}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Invite
                          </button>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              )}

              {/* Invite Link Sub-tab */}
              {inviteSubTab === 'link' && (
                <div>
                  {/* Invite Settings */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4">Invite Link Settings</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Max Uses */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Users Can Join
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={inviteMaxUses}
                          onChange={(e) => setInviteMaxUses(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                      </div>

                      {/* Expires In */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expires In (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={inviteExpiresIn}
                          onChange={(e) => setInviteExpiresIn(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="30"
                        />
                        <p className="text-xs text-gray-500 mt-1">Days until link expires</p>
                      </div>

                      {/* Custom Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Message
                        </label>
                        <input
                          type="text"
                          value={inviteMessage}
                          onChange={(e) => setInviteMessage(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Join our awesome group!"
                          maxLength="200"
                        />
                        <p className="text-xs text-gray-500 mt-1">Personal message for invitees</p>
                      </div>
                    </div>

                    <button
                      onClick={generateInviteLink}
                      disabled={!selectedGroupForInvite}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate Invite Link
                    </button>
                  </div>
                    
                  {inviteLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Invite Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inviteLink}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                        <button
                          onClick={handleCopyInviteLink}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Copy link"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invite Link Information */}
                  {inviteInfoLoading ? (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-sm text-gray-600">Loading invite information...</span>
                      </div>
                    </div>
                  ) : inviteInfo ? (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Invite Link Information
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Invite Message */}
                        {inviteInfo.message && (
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-sm text-blue-700 italic">"{inviteInfo.message}"</p>
                          </div>
                        )}
                        
                        {/* Usage Statistics */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span>Usage</span>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {inviteInfo.number_of_uses} / {inviteInfo.max_uses === 0 ? 'Unlimited' : inviteInfo.max_uses}
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Expires</span>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {inviteInfo.expired_date 
                                ? new Date(inviteInfo.expired_date).toLocaleDateString()
                                : 'Never'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {inviteInfo.max_uses > 0 && (
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>Link Usage Progress</span>
                              <span>{Math.round((inviteInfo.number_of_uses / inviteInfo.max_uses) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.round((inviteInfo.number_of_uses / inviteInfo.max_uses) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Link Status</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            inviteInfo.number_of_uses >= inviteInfo.max_uses && inviteInfo.max_uses > 0
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : new Date(inviteInfo.expired_date) < new Date() && inviteInfo.expired_date
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {inviteInfo.number_of_uses >= inviteInfo.max_uses && inviteInfo.max_uses > 0
                              ? 'Fully Used'
                              : new Date(inviteInfo.expired_date) < new Date() && inviteInfo.expired_date
                              ? 'Expired'
                              : 'Active'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {checkingExistingLink ? (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-sm text-gray-600">Checking for existing invite links...</span>
                      </div>
                    </div>
                  ) : !inviteLink && selectedGroupForInvite ? (
                    <p className="text-gray-500 text-center py-8">
                      Configure settings above and click "Generate Invite Link" to create a shareable link for your group
                    </p>
                  ) : !selectedGroupForInvite ? (
                    <p className="text-gray-500 text-center py-8">
                      Please select a group first to generate an invite link
                    </p>
                  ) : null}
                </div>
              )}
              </div>
            </div>
          )}
        </div>

        {/* Group Invitations Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Received Invitations</h3>
              </div>
              {pendingInvitations.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {pendingInvitations.length} new
                </span>
              )}
            </div>

            {/* Invitation List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700 mb-1">No invitations yet</p>
                  <p className="text-xs text-gray-500">Group invitations will appear here</p>
                </div>
              ) : (
                pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm">{invitation.group_name}</h4>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          {invitation.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(invitation.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    {invitation.message && (
                      <div className="bg-blue-50 rounded-lg p-2 mb-3 border-l-3 border-blue-200">
                        <p className="text-xs text-blue-700 italic">"{invitation.message}"</p>
                      </div>
                    )}

                    {/* Inviter Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-600">
                          <span className="font-medium">{invitation.inviter_first_name} {invitation.inviter_last_name}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{invitation.inviter_email}</span>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-xs text-gray-600">Role: <span className="font-medium text-gray-800 capitalize">{invitation.role}</span></span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectInvitation(invitation.id)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {pendingInvitations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  {pendingInvitations.length} invitation{pendingInvitations.length > 1 ? 's' : ''} pending
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateGroupForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Group Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Image</label>
                <div className="flex items-center space-x-4">
                  {groupImagePreview ? (
                    <div className="relative">
                      <img
                        src={groupImagePreview}
                        alt="Group preview"
                        className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-gray-100'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <svg className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <label
                      htmlFor="group-image-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {groupImagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                    <input
                      id="group-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF up to 5MB</p>
                    {!groupImagePreview && (
                      <p className="text-xs text-blue-500 mt-1">or drag and drop an image here</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateGroupForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || !groupDescription.trim() || createLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadStep === 'uploading' ? 'Uploading Image...' : 
                 uploadStep === 'creating' ? 'Creating Group...' : 
                 createLoading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Group Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Update Group</h2>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  resetUpdateGroupForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Group Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Image</label>
                <div className="flex items-center space-x-4">
                  {updateGroupImagePreview ? (
                    <div className="relative">
                      <img
                        src={updateGroupImagePreview}
                        alt="Group preview"
                        className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleUpdateRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                        isUpdateDragging 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-gray-100'
                      }`}
                      onDragOver={handleUpdateDragOver}
                      onDragLeave={handleUpdateDragLeave}
                      onDrop={handleUpdateDrop}
                    >
                      <svg className={`w-8 h-8 ${isUpdateDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <label
                      htmlFor="update-group-image-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {updateGroupImagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                    <input
                      id="update-group-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleUpdateImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF up to 5MB</p>
                    {!updateGroupImagePreview && (
                      <p className="text-xs text-blue-500 mt-1">or drag and drop an image here</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                <input
                  type="text"
                  value={updateGroupName}
                  onChange={(e) => setUpdateGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={updateGroupDescription}
                  onChange={(e) => setUpdateGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  resetUpdateGroupForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGroup}
                disabled={!updateGroupName.trim() || !updateGroupDescription.trim() || updateLoading}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadStep === 'uploading' ? 'Uploading Image...' : 
                 uploadStep === 'creating' ? 'Updating Group...' : 
                 updateLoading ? 'Updating...' : 'Update Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Group Selection */}
            <div className="mb-6">
              <label htmlFor="event-group-select" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Select Group
                </div>
              </label>
              <select
                id="event-group-select"
                value={selectedGroupIdForEvent}
                onChange={(e) => setSelectedGroupIdForEvent(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a group...</option>
                {myGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.events} events)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Title */}
              <div>
                <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                <input
                  type="text"
                  id="event-title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter event title"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  id="event-category"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category...</option>
                  <option value="Education">Education</option>
                  <option value="Business">Business</option>
                  <option value="Technology">Technology</option>
                  <option value="Social">Social</option>
                  <option value="Sports">Sports</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Short Description */}
              <div className="md:col-span-2">
                <label htmlFor="event-short-desc" className="block text-sm font-medium text-gray-700 mb-2">Short Description *</label>
                <textarea
                  id="event-short-desc"
                  value={eventShortDescription}
                  onChange={(e) => setEventShortDescription(e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of your event"
                />
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="event-start-time" className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  id="event-start-time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="event-end-time" className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  id="event-end-time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  id="event-location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Event location"
                />
              </div>

              {/* Full Address */}
              <div>
                <label htmlFor="event-full-address" className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                <input
                  type="text"
                  id="event-full-address"
                  value={eventFullAddress}
                  onChange={(e) => setEventFullAddress(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Complete event address"
                />
              </div>

              {/* Capacity */}
              <div>
                <label htmlFor="event-capacity" className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  id="event-capacity"
                  value={eventCapacity}
                  onChange={(e) => setEventCapacity(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Maximum number of attendees"
                  min="1"
                />
              </div>

              {/* Long Description */}
              <div className="md:col-span-2">
                <label htmlFor="event-long-desc" className="block text-sm font-medium text-gray-700 mb-2">Long Description</label>
                <textarea
                  id="event-long-desc"
                  value={eventLongDescription}
                  onChange={(e) => setEventLongDescription(e.target.value)}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed description of your event"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!selectedGroupIdForEvent || !eventTitle.trim() || !eventShortDescription.trim() || createEventLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createEventLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization Required Modal */}
      <OrganizationRequiredModal
        isOpen={showOrgRequiredModal}
        onClose={() => setShowOrgRequiredModal(false)}
        onRegister={() => {
          setShowOrgRequiredModal(false);
          navigate('/organization/register');
        }}
      />
      </div>
    </div>
  );
};
