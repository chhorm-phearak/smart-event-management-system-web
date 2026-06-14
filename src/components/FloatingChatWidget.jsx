import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Search, Send, ArrowLeft, Check, CheckCheck, MoreVertical, Pencil, Trash2, Paperclip, Smile } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { chatService } from '@/services/chatService';
import { socketService } from '@/services/socketService';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=2563eb&color=fff&name=';

const formatPreviewTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diff = (now - d) / 86400000;
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatMessageTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const FloatingChatWidget = () => {
  const { user } = useAuth();
  const currentUserId = user?.id ?? user?.user_id ?? null;

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingSaving, setEditingSaving] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);

  const [pendingFiles, setPendingFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPos, setEmojiPickerPos] = useState({ bottom: 0, left: 0 });

  const activeGroupIdRef = useRef(null);
  const joinedGroupIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);

  // Total unread across all conversations (for badge)
  const totalUnread = useMemo(
    () => conversations.reduce((s, c) => s + (c.unread_count || 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(
    () => conversations.filter((g) => (g.name || '').toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setConvLoading(true);
      const res = await chatService.getConversations();
      const list = res?.data?.conversations || [];
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      return [];
    } finally {
      setConvLoading(false);
    }
  };

  // Initial load + on user change
  useEffect(() => {
    if (!currentUserId) return;
    fetchConversations();
  }, [currentUserId]);

  // Sync unread count when GroupPage marks a group as read
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

  // Listen for conversation updates globally so unread badge updates even when closed
  useEffect(() => {
    if (!currentUserId) return;
    const socket = socketService.connect();
    if (!socket) return;

    const handleConversationUpdate = (payload) => {
      if (!payload?.group_id) return;
      const activeId = activeGroupIdRef.current;
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
        return [...merged].sort((a, b) => {
          const aT = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
          const bT = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
          return bT - aT;
        });
      });
      // If new group not in list, refetch
      setConversations((prev) => {
        if (!prev.some((c) => c.id === payload.group_id)) fetchConversations();
        return prev;
      });
    };

    const handleGroupRead = (payload) => {
      if (!payload?.group_id) return;
      if (payload.user_id && payload.user_id !== currentUserId) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === payload.group_id ? { ...c, unread_count: 0 } : c))
      );
    };

    socket.on('chat:conversation_update', handleConversationUpdate);
    socket.on('chat:group_read', handleGroupRead);
    socket.on('chat:messages_read', handleGroupRead);
    return () => {
      socket.off('chat:conversation_update', handleConversationUpdate);
      socket.off('chat:group_read', handleGroupRead);
      socket.off('chat:messages_read', handleGroupRead);
    };
  }, [currentUserId]);

  // Open active group: load messages, mark read, join socket room
  useEffect(() => {
    activeGroupIdRef.current = activeGroup?.id || null;
    if (!activeGroup?.id) {
      setMessages([]);
      return;
    }
    const groupId = activeGroup.id;
    let cancelled = false;

    (async () => {
      try {
        setMsgLoading(true);
        const res = await chatService.getMessages(groupId, { limit: 30 });
        const list = res?.data?.messages || [];
        if (!cancelled) setMessages(list);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setMsgLoading(false);
      }
      if (cancelled) return;

      try {
        await chatService.markAsRead(groupId);
        window.dispatchEvent(new CustomEvent('chat:group_marked_read', { detail: { group_id: groupId } }));
      } catch (err) {
        console.warn('markAsRead failed:', err?.message || err);
      }
      if (cancelled) return;

      setConversations((prev) =>
        prev.map((c) => (c.id === groupId ? { ...c, unread_count: 0 } : c))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [activeGroup?.id]);

  // Socket: join active group room and listen for events
  useEffect(() => {
    if (!activeGroup?.id) return;
    const socket = socketService.connect();
    if (!socket) return;

    const groupId = activeGroup.id;

    const join = () => {
      socketService.joinGroup(groupId);
      joinedGroupIdRef.current = groupId;
    };
    if (socket.connected) join();
    else socket.once('connect', join);

    const handleNewMessage = (msg) => {
      if (!msg || msg.group_id !== groupId) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.sender?.id && msg.sender.id !== currentUserId) {
        chatService.markAsRead(groupId).then(() => {
          window.dispatchEvent(new CustomEvent('chat:group_marked_read', { detail: { group_id: groupId } }));
        }).catch(() => {});
      }
    };

    const handleEdited = (msg) => {
      if (!msg || msg.group_id !== groupId) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };

    const handleDeleted = ({ id }) => {
      if (!id) return;
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    const handleGroupRead = (payload) => {
      if (!payload || payload.group_id !== groupId) return;
      const { user_id, read_at, message_ids } = payload;
      if (!user_id) return;
      const readAt = read_at || new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) => {
          const inScope = !message_ids || message_ids.includes(m.id);
          if (!inScope) return m;
          if ((m.read_by || []).some((r) => r.user_id === user_id)) return m;
          const newReadBy = [...(m.read_by || []), { user_id, read_at: readAt }];
          return { ...m, read_by: newReadBy, read_count: (m.read_count ?? newReadBy.length - 1) + 1 };
        })
      );
    };

    const handleMessageRead = (payload) => {
      if (!payload || payload.group_id !== groupId) return;
      const { message_id, user_id, read_at } = payload;
      if (!message_id || !user_id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== message_id) return m;
          if ((m.read_by || []).some((r) => r.user_id === user_id)) return m;
          const newReadBy = [...(m.read_by || []), { user_id, read_at: read_at || new Date().toISOString() }];
          return { ...m, read_by: newReadBy, read_count: (m.read_count ?? newReadBy.length - 1) + 1 };
        })
      );
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:message_edited', handleEdited);
    socket.on('chat:message_deleted', handleDeleted);
    socket.on('chat:group_read', handleGroupRead);
    socket.on('chat:messages_read', handleGroupRead);
    socket.on('chat:message_read', handleMessageRead);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:message_edited', handleEdited);
      socket.off('chat:message_deleted', handleDeleted);
      socket.off('chat:group_read', handleGroupRead);
      socket.off('chat:messages_read', handleGroupRead);
      socket.off('chat:message_read', handleMessageRead);
      socket.off('connect', join);
      socketService.leaveGroup(groupId);
      joinedGroupIdRef.current = null;
    };
  }, [activeGroup?.id, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length, activeGroup?.id]);

  // Refetch conversations when widget opens; reset active group when closing
  const handleToggleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      await fetchConversations();
    } else {
      // Closing: drop active group so incoming messages increment the unread badge
      // and socket listeners / room membership are cleaned up.
      setActiveGroup(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveGroup(null);
  };

  // Edit / delete handlers
  const handleStartEdit = (msg) => {
    setOpenMessageMenuId(null);
    setEditingMessageId(msg.id);
    setEditingContent(msg.content || '');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !activeGroup?.id) return;
    const text = editingContent.trim();
    if (!text) return;
    try {
      setEditingSaving(true);
      const res = await chatService.editMessage(activeGroup.id, editingMessageId, text);
      const updated = res?.data?.message;
      if (updated) {
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
      setEditingMessageId(null);
      setEditingContent('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    } finally {
      setEditingSaving(false);
    }
  };

  const handleDelete = async (messageId) => {
    if (!activeGroup?.id) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      setDeletingMessageId(messageId);
      setOpenMessageMenuId(null);
      await chatService.deleteMessage(activeGroup.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removePendingFile = (idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleEmojiSelect = (emojiData) => {
    const emoji = emojiData?.emoji || '';
    if (!emoji) return;
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = input.slice(0, start) + emoji + input.slice(end);
      setInput(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + emoji.length;
        el.focus();
      });
    } else {
      setInput((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleToggleEmojiPicker = () => {
    if (!showEmojiPicker && emojiButtonRef.current) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }
    setShowEmojiPicker((v) => !v);
  };

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e) => {
      if (
        emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) &&
        emojiButtonRef.current && !emojiButtonRef.current.contains(e.target)
      ) setShowEmojiPicker(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setShowEmojiPicker(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showEmojiPicker]);

  const handleSend = async () => {
    const text = input.trim();
    if (!activeGroup?.id || (!text && pendingFiles.length === 0) || sending) return;
    try {
      setSending(true);
      const res = await chatService.sendMessage(activeGroup.id, { content: text, files: pendingFiles });
      const newMsg = res?.data?.message;
      if (newMsg) {
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      }
      setInput('');
      setPendingFiles([]);
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  if (!currentUserId) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleToggleOpen}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] sm:w-96 h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-blue-600 text-white">
            <div className="flex items-center gap-2 min-w-0">
              {activeGroup && (
                <button
                  onClick={() => setActiveGroup(null)}
                  className="p-1 -ml-1 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              {activeGroup ? (
                <>
                  <img
                    src={activeGroup.image_url || `${DEFAULT_AVATAR}${encodeURIComponent(activeGroup.name || 'G')}`}
                    alt={activeGroup.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">{activeGroup.name}</h3>
                    <p className="text-[11px] text-blue-100">
                      {activeGroup.member_count || 0} members
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <h3 className="text-sm font-bold">Messages</h3>
                </>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {!activeGroup ? (
            // Conversations List
            <>
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {convLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center p-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-700 mb-1">No conversations</p>
                    <p className="text-xs text-gray-500">Join a group to start chatting</p>
                  </div>
                ) : (
                  filteredConversations.map((group) => {
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
                        onClick={() => setActiveGroup(group)}
                        className="w-full p-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <img
                          src={avatarSrc}
                          alt={group.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                              {group.name}
                            </p>
                            {previewTime && (
                              <span className={`text-[11px] flex-shrink-0 ${unread > 0 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                                {previewTime}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                              {previewText}
                            </p>
                            {unread > 0 && (
                              <span className="min-w-[18px] h-[18px] px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            // Chat View
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
                {msgLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageCircle className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-xs font-medium text-gray-700">No messages yet</p>
                    <p className="text-[11px] text-gray-500">Be the first to say hello 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender?.id === currentUserId;
                    const senderName = msg.sender?.first_name
                      ? `${msg.sender.first_name}${msg.sender.last_name ? ' ' + msg.sender.last_name : ''}`
                      : msg.sender?.name || 'Unknown';
                    const senderAvatar =
                      msg.sender?.profile_picture ||
                      msg.sender?.avatar ||
                      `${DEFAULT_AVATAR}${encodeURIComponent(senderName)}`;
                    const readByOthers = (msg.read_by || []).filter((r) => r.user_id !== currentUserId).length;
                    const isEditing = editingMessageId === msg.id;
                    return (
                      <div key={msg.id} className={`group/msg flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <img
                            src={senderAvatar}
                            alt={senderName}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        {isMe && !isEditing && (
                          <div className="relative self-center opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMessageMenuId(openMessageMenuId === msg.id ? null : msg.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                              title="Message options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {openMessageMenuId === msg.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMessageMenuId(null)}
                                />
                                <div className="absolute right-full mr-1 top-1/2 -translate-y-1/2 z-20 w-28 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                  <button
                                    onClick={() => handleStartEdit(msg)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(msg.id)}
                                    disabled={deletingMessageId === msg.id}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && (
                            <span className="text-[10px] font-medium text-gray-600 mb-0.5 ml-2">{senderName}</span>
                          )}
                          <div
                            className={`px-3 py-1.5 shadow-sm ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-1.5 min-w-[180px]">
                                <textarea
                                  autoFocus
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEdit();
                                    } else if (e.key === 'Escape') {
                                      handleCancelEdit();
                                    }
                                  }}
                                  rows={2}
                                  className={`w-full resize-none rounded-md px-2 py-1 text-sm outline-none ${
                                    isMe
                                      ? 'bg-blue-700/40 text-white border border-blue-300/40'
                                      : 'bg-white text-gray-900 border border-gray-200'
                                  }`}
                                />
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={handleCancelEdit}
                                    className={`p-1 rounded ${isMe ? 'hover:bg-blue-700/40 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={editingSaving || !editingContent.trim()}
                                    className={`p-1 rounded disabled:opacity-50 ${isMe ? 'hover:bg-blue-700/40 text-white' : 'hover:bg-blue-50 text-blue-600'}`}
                                    title="Save"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              msg.content && (
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {msg.content}
                                </p>
                              )
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 px-1">
                            <span className="text-[10px] text-gray-400">{formatMessageTime(msg.created_at)}</span>
                            {msg.is_edited && (
                              <span className="text-[10px] text-gray-400 italic">· edited</span>
                            )}
                            {isMe && (
                              readByOthers > 0 ? (
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                              ) : (
                                <Check className="w-3 h-3 text-gray-400" />
                              )
                            )}
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
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pendingFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                        <Paperclip className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-gray-800 max-w-[120px] truncate">{file.name}</span>
                        <button onClick={() => removePendingFile(idx)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-1.5">
                  <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" />
                  <button onClick={handlePickFiles} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0" title="Attach file" disabled={pendingFiles.length >= 5}>
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <div className="flex-shrink-0">
                    <button ref={emojiButtonRef} type="button" onClick={handleToggleEmojiPicker} className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`} title="Emoji">
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 resize-none px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none max-h-24"
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && pendingFiles.length === 0) || sending}
                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Emoji picker rendered outside overflow-hidden container via fixed positioning */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          style={{ position: 'fixed', bottom: emojiPickerPos.bottom, left: emojiPickerPos.left, zIndex: 9999 }}
          className="shadow-2xl rounded-xl overflow-hidden"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            theme={Theme.LIGHT}
            emojiStyle={EmojiStyle.NATIVE}
            width={300}
            height={350}
            searchPlaceholder="Search emoji..."
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
          />
        </div>
      )}
    </>
  );
};

export default FloatingChatWidget;
