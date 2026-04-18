import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Plus, X, Calendar as CalendarIcon, MapPin, Upload, Type, AlignLeft, Users, QrCode, Clock, Tag, FileText, UserPlus, ListChecks, Sparkles, CheckCircle2, Image } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { eventService, organizationService, uploadSingle } from '@/services';
import { getApiOrigin, getOrganizationId } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';

const extractEventId = (value) => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value !== 'object') return '';
  return String(
    value.id ??
      value.event_id ??
      value.eventId ??
      value.event?.id ??
      value.data?.id ??
      value.data?.event_id ??
      value.data?.event?.id ??
      ''
  );
};

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const organizationId = user?.organization_id ?? user?.organizationId ?? user?.organization?.id ?? getOrganizationId() ?? null;
  const [submitStatus, setSubmitStatus] = useState(null); // 'creating' | 'uploading'
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [registeredQrCode, setRegisteredQrCode] = useState('');

  const { data: staffListData, isLoading: staffLoading, isPending: staffPending, isError: staffError } = useQuery({
    queryKey: ['organization', organizationId, 'members'],
    queryFn: async () => {
      const { data } = await organizationService.getMembers(organizationId);
      return (data || []).map((member) => ({
        id: member.user_id,
        user_id: member.user_id,
        name: [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Unknown',
        email: member.email || '',
        role: 'Coordinator',
      }));
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });
  const staffList = staffListData ?? [];

  const { data: createdEventList = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const eventRes = await eventService.getAllEvents();
      return eventRes?.data?.events ?? eventRes?.events ?? [];
    },
    enabled: !!createdEventId,
  });

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    fullAddress: '',
    category: '',
    capacity: 400,
    duration: 0,
    image: null,
    isPublic: true,
  });

  const [errors, setErrors] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const categories = [
    'Technology',
    'Business',
    'Education',
    'Entertainment',
    'Sports',
    'Health',
    'Arts',
    'Conference',
    'Other',
  ];

  // Calendar helpers
  const getCalendarDays = (year, month) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const prevMonth = new Date(year, month, 0);
    const prevDays = prevMonth.getDate();
    const days = [];
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ date: prevDays - i, isCurrentMonth: false, month: month - 1, year: month === 0 ? year - 1 : year });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: d, isCurrentMonth: true, month, year });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({ date: d, isCurrentMonth: false, month: nextMonth, year: nextYear });
    }
    return days;
  };

  const toYMD = (year, month, date) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(date).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const isPastDate = (year, month, date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(year, month, date);
    return d < today;
  };

  const isToday = (year, month, date) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === date;
  };

  const handleCalendarSelect = (year, month, date) => {
    const ymd = toYMD(year, month, date);
    setFormData((prev) => ({ ...prev, eventDate: ymd }));
    if (errors.eventDate) setErrors((prev) => ({ ...prev, eventDate: '' }));
  };

  const goPrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const goToToday = () => {
    const d = new Date();
    setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
    handleCalendarSelect(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const calendarDays = getCalendarDays(calendarMonth.year, calendarMonth.month);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (formData.startTime && formData.endTime && formData.eventDate) {
      calculateDuration();
    }
  }, [formData.startTime, formData.endTime, formData.eventDate]);

  useEffect(() => {
    if (formData.eventDate && showCalendar) {
      const [y, m] = formData.eventDate.split('-').map(Number);
      if (y && m) setCalendarMonth({ year: y, month: m - 1 });
    }
  }, [formData.eventDate, showCalendar]);

  const createEventMutation = useMutation({
    mutationFn: async ({ payload, image }) => {
      const createResponse = await eventService.createEvent(payload);
      const eventId = extractEventId(createResponse);
      if (eventId && image) {
        setSubmitStatus('uploading');
        try {
          const uploadResponse = await uploadSingle(image);
          const fileUrl = uploadResponse?.data?.file?.file_url;
          if (fileUrl) {
            const fullImageUrl = fileUrl.startsWith('http') ? fileUrl : `${getApiOrigin()}${fileUrl}`;
            await eventService.addEventImages(eventId, [fullImageUrl]);
          }
        } finally {
          setSubmitStatus(null);
        }
      }
      return eventId;
    },
    onSuccess: (eventId) => {
      setSubmitStatus(null);
      toast.success('Event created successfully!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate(-1);
    },
    onError: (error) => {
      setSubmitStatus(null);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to create event. Please try again.';
      setErrors((prev) => ({ ...prev, submit: message }));
    },
  });

  const registerEventMutation = useMutation({
    mutationFn: (eventId) => {
      const normalizedEventId = extractEventId(eventId);
      if (!normalizedEventId) throw new Error('Event id not found for registration.');
      return eventService.registerForEvent(normalizedEventId);
    },
    onSuccess: (response, eventId) => {
      const nextQrCode =
        response?.data?.qrcode ??
        response?.data?.qr_code ??
        response?.qrcode ??
        response?.qr_code ??
        '';
      if (nextQrCode) {
        setRegisteredQrCode(nextQrCode);
      }
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event registered. QR code is ready.');
    },
    onError: (error, eventId) => {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to register event.';
      setErrors((prev) => ({ ...prev, register: message }));
      toast.error(message);
    },
  });

  const calculateDuration = () => {
    if (formData.startTime && formData.endTime && formData.eventDate) {
      const startDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
      
      if (endDateTime > startDateTime) {
        const diffMs = endDateTime - startDateTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        setFormData((prev) => ({ ...prev, duration: diffMinutes }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'startTime' && value && prev.endTime && prev.endTime <= value) {
        next.endTime = '';
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size must be less than 5MB' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, image: '' }));
    }
  };

  const handleStaffToggle = (staff) => {
    setSelectedStaff((prev) => {
      const isSelected = prev.some((s) => s.user_id === staff.user_id);
      if (isSelected) {
        return prev.filter((s) => s.user_id !== staff.user_id);
      } else {
        return [...prev, { ...staff, role: staff.role || 'Coordinator' }];
      }
    });
  };

  const handleStaffRoleChange = (userId, role) => {
    setSelectedStaff((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, role } : s))
    );
  };

  const handleAddAgenda = () => {
    setAgendas((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: '',
        description: '',
        startTime: '',
        endTime: '',
      },
    ]);
  };

  const handleUpdateAgenda = (id, field, value) => {
    setAgendas((prev) =>
      prev.map((agenda) =>
        agenda.id === id ? { ...agenda, [field]: value } : agenda
      )
    );
  };

  const handleRemoveAgenda = (id) => {
    setAgendas((prev) => prev.filter((agenda) => agenda.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!organizationId) newErrors.organization = 'You need to be part of an organization to create events.';
    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (formData.title.length > 150) newErrors.title = 'Title must be 150 characters or less';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
    if (!formData.description.trim()) newErrors.description = 'Full description is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.fullAddress.trim()) newErrors.fullAddress = 'Full address is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.capacity || formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';

    // Validate time logic
    if (formData.startTime && formData.endTime && formData.eventDate) {
      const startDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
      if (endDateTime <= startDateTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitStatus('creating');
    setErrors((prev) => ({ ...prev, submit: '' }));

    const startDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);

    const payload = {
      organization_id: organizationId,
      group_id: '',
      title: formData.title,
      short_description: formData.shortDescription,
      long_description: formData.description,
      category: formData.category,
      location: formData.location,
      full_address: formData.fullAddress,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      duration: formData.duration || Math.floor((endDateTime - startDateTime) / (1000 * 60)),
      capacity: Number(formData.capacity),
      status: 'DRAFT',
      is_public: formData.isPublic ?? true,
      agenda: agendas
        .filter((a) => a.title?.trim() && (a.startTime || formData.startTime) && (a.endTime || formData.endTime))
        .map((a) => {
          const agendaStart = new Date(`${formData.eventDate}T${a.startTime || formData.startTime}`);
          const agendaEnd = new Date(`${formData.eventDate}T${a.endTime || formData.endTime}`);
          return {
            title: a.title,
            description: a.description || '',
            start_time: agendaStart.toISOString(),
            end_time: agendaEnd.toISOString(),
          };
        }),
      staff: selectedStaff.map((s) => ({
        user_id: s.user_id,
        role: s.role || 'Coordinator',
      })),
    };

    createEventMutation.mutate({ payload, image: formData.image });
  };

  const handleRegisterEvent = () => {
    const eventIdToRegister = extractEventId(createdEventId) || extractEventId(createdEvent);
    if (!eventIdToRegister) {
      const message = 'Event id is missing. Please create the event again.';
      setErrors((prev) => ({ ...prev, register: message }));
      toast.error(message);
      return;
    }
    setErrors((prev) => ({ ...prev, register: '' }));
    registerEventMutation.mutate(eventIdToRegister);
  };

  const createdEvent = createdEventList.find((event) => event.id === createdEventId);
  const eventQrCode = registeredQrCode || createdEvent?.qrcode || createdEvent?.qr_code || '';
  const isEventRegistered = eventQrCode.trim() !== '';

  // Form sections for step indicator
  const formSections = [
    { id: 'details', label: 'Event Details', icon: FileText },
    { id: 'staff', label: 'Assign Staff', icon: UserPlus },
    { id: 'datetime', label: 'Date & Time', icon: Clock },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'agenda', label: 'Agenda', icon: ListChecks },
  ];

  if (createdEventId) {
    return (
      <div className="w-full">
        {/* Success Header */}
        <div className="mb-8">
          <Button 
            type="button" 
            size="sm" 
            onClick={() => { setCreatedEventId(null); setRegisteredQrCode(''); setErrors({}); }} 
            className="mb-6 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-300"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Event Created Successfully!
              </h1>
              <p className="text-muted-foreground mt-1">Register your event to generate a QR code for check-in.</p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
          <CardHeader className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                <QrCode className="size-5 text-white" />
              </div>
              Event QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {isEventRegistered ? (
              <div className="flex flex-col items-center gap-6">
                <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-violet-200 shadow-inner">
                  <QRCodeSVG value={eventQrCode} size={220} level="M" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">QR Code Ready!</p>
                  <p className="text-sm text-muted-foreground mt-1">Scan this QR code at the event entrance.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="flex items-center justify-center size-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                  <QrCode className="size-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">No QR Code Yet</p>
                  <p className="text-muted-foreground text-sm mt-1">Register your event to generate a QR code for attendees.</p>
                </div>
                <Button
                  type="button"
                  onClick={handleRegisterEvent}
                  disabled={registerEventMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all duration-300"
                >
                  <Sparkles className="size-4" />
                  {registerEventMutation.isPending ? 'Registering...' : 'Register & Generate QR Code'}
                </Button>
                {errors.register && (
                  <p className="text-sm text-destructive">{errors.register}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-8 pb-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="px-6">
            Done
          </Button>
          <Button 
            type="button" 
            className="gap-2 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25" 
            onClick={() => { setCreatedEventId(null); setRegisteredQrCode(''); setErrors({}); }}
          >
            <Plus className="size-4" />
            Create Another Event
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Header with Back Button */}
      <div className="mb-8">
        <Button 
          type="button" 
          size="sm" 
          onClick={() => navigate(-1)} 
          className="mb-6 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-300"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Sparkles className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Create New Event
            </h1>
            <p className="text-muted-foreground mt-1">Fill in the details to create and publish your event.</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 border border-border/50 w-fit">
          {formSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center size-8 rounded-xl bg-blue-600 text-white shadow-md">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{section.label}</span>
                </div>
                {index < formSections.length - 1 && (
                  <div className="w-6 h-0.5 bg-blue-400 dark:bg-blue-600 mx-2 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.organization && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
            {errors.organization}
          </div>
        )}

        {/* Event Details Section */}
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <FileText className="size-5 text-white" />
              </div>
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                <Type className="size-4 text-blue-500" />
                Event Title <span className="text-destructive">*</span>
              </Label>
              <div className="relative group">
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter an engaging title for your event"
                  maxLength={150}
                  className={cn(
                    'h-12 text-base transition-all duration-300 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                    errors.title && 'border-destructive aria-invalid:ring-destructive/20'
                  )}
                  aria-invalid={!!errors.title}
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                <p className={cn(
                  "text-sm ml-auto transition-colors",
                  formData.title.length > 130 ? "text-amber-500 font-medium" : "text-muted-foreground"
                )}>{formData.title.length}/150</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription" className="text-sm font-semibold flex items-center gap-2">
                <AlignLeft className="size-4 text-blue-500" />
                Short Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="A catchy tagline that captures your event's essence"
                className={cn(
                  'h-12 text-base transition-all duration-300 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                  errors.shortDescription && 'border-destructive aria-invalid:ring-destructive/20'
                )}
                aria-invalid={!!errors.shortDescription}
              />
              {errors.shortDescription && (
                <p className="text-sm text-destructive">{errors.shortDescription}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-blue-500" />
                Full Description <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event in detail. What will attendees experience? What makes it special?"
                rows={6}
                className={cn(
                  'flex min-h-36 w-full rounded-xl border-2 bg-transparent px-4 py-3 text-base shadow-xs transition-all duration-300 outline-none placeholder:text-muted-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                  errors.description ? 'border-destructive ring-destructive/20' : 'border-input'
                )}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Image className="size-4 text-blue-500" />
                Event Image
              </Label>
              {imagePreview ? (
                <div className="relative group rounded-2xl overflow-hidden border border-border bg-slate-100 dark:bg-slate-800">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-72 object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData((prev) => ({ ...prev, image: null }));
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white text-sm font-medium">Image uploaded successfully</p>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-300 group">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="size-8 text-blue-500" />
                    </div>
                    <p className="mb-2 text-base font-medium text-foreground">
                      Drop your image here or <span className="text-blue-500">browse</span>
                    </p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
              {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Assign Staff Section */}
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <UserPlus className="size-5 text-white" />
              </div>
              Assign Staff
              {selectedStaff.length > 0 && (
                <span className="ml-auto text-sm font-normal px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {selectedStaff.length} selected
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {selectedStaff.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {selectedStaff.map((staff) => (
                  <span
                    key={staff.user_id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium border border-blue-200 dark:border-blue-800 shadow-sm"
                  >
                    <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    {staff.name} {staff.role && <span className="text-blue-500">• {staff.role}</span>}
                    <button
                      type="button"
                      onClick={() => handleStaffToggle(staff)}
                      className="rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-1 transition-colors ml-1"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 border-2 border-dashed border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all duration-300 group"
              onClick={() => setShowStaffModal(true)}
              disabled={!organizationId || (staffLoading && !staffListData)}
              title={!organizationId ? 'Organization required' : undefined}
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 mr-3 group-hover:scale-110 transition-transform duration-300">
                <Plus className="size-4 text-blue-600" />
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {(staffLoading && !staffListData) ? 'Loading staff...' : 'Click to assign staff members'}
              </span>
            </Button>
            {(errors.staff || staffError) && (
              <p className="text-sm text-destructive mt-3">
                {errors.staff || 'Failed to load organization members'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Event Date and Time Section */}
        <Card className="border-0 shadow-xl shadow-black/5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <Clock className="size-5 text-white" />
              </div>
              Event Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event Date with calendar picker */}
              <div className="md:col-span-1 relative space-y-2">
                <Label htmlFor="eventDate" className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon className="size-4 text-blue-500" />
                  Event Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <Input
                    id="eventDate"
                    name="eventDate"
                    readOnly
                    value={formData.eventDate ? new Date(formData.eventDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    placeholder="Select date"
                    onClick={() => setShowCalendar(true)}
                    className={cn(
                      'h-12 cursor-pointer pr-12 text-base transition-all duration-300 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                      errors.eventDate && 'border-destructive aria-invalid:ring-destructive/20'
                    )}
                    aria-invalid={!!errors.eventDate}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <CalendarIcon className="size-4 text-blue-600" />
                    </div>
                  </div>
                </div>
                {errors.eventDate && <p className="text-sm text-destructive">{errors.eventDate}</p>}

                {/* Calendar dropdown */}
                {showCalendar && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                      aria-hidden="true"
                      onClick={() => setShowCalendar(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 z-50 w-[340px] rounded-2xl shadow-2xl border border-border bg-card overflow-hidden">
                      <div className="p-5 border-b border-border bg-blue-50 dark:bg-blue-950/30">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg">{monthLabel}</h3>
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon-sm" onClick={goPrevMonth} aria-label="Previous month" className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                              <ChevronLeft className="size-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={goNextMonth} aria-label="Next month" className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                              <ChevronLeft className="size-4 rotate-180" />
                            </Button>
                          </div>
                        </div>
                        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-blue-600 hover:text-blue-700" onClick={goToToday}>
                          Go to today
                        </Button>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-7 gap-1 mb-3">
                          {weekDays.map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((cell, idx) => {
                            const ymd = toYMD(cell.year, cell.month, cell.date);
                            const selected = formData.eventDate === ymd;
                            const past = isPastDate(cell.year, cell.month, cell.date);
                            const today = isToday(cell.year, cell.month, cell.date);
                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={past}
                                onClick={() => {
                                  if (!past) {
                                    handleCalendarSelect(cell.year, cell.month, cell.date);
                                    setShowCalendar(false);
                                  }
                                }}
                                className={cn(
                                  'aspect-square flex items-center justify-center text-sm rounded-xl transition-all duration-200 font-medium',
                                  !cell.isCurrentMonth && 'text-muted-foreground/40',
                                  past && cell.isCurrentMonth && 'text-muted-foreground/40 cursor-not-allowed',
                                  !past && cell.isCurrentMonth && 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
                                  selected && 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700',
                                  today && !selected && 'ring-2 ring-blue-500 ring-offset-2'
                                )}
                              >
                                {cell.date}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-blue-500" />
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <TimePicker
                  value={formData.startTime}
                  onChange={(v) => {
                    setFormData((prev) => {
                      const next = { ...prev, startTime: v };
                      if (v && prev.endTime && prev.endTime <= v) next.endTime = '';
                      return next;
                    });
                    if (errors.startTime) setErrors((e) => ({ ...e, startTime: '' }));
                  }}
                  placeholder="Select start time"
                  className={cn('h-12 [&_button]:h-12 [&_button]:border-2 [&_button]:transition-all [&_button]:duration-300', errors.startTime && '[&_button]:border-destructive')}
                  aria-invalid={!!errors.startTime}
                />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-blue-500" />
                  End Time <span className="text-destructive">*</span>
                </Label>
                <TimePicker
                  value={formData.endTime}
                  onChange={(v) => {
                    setFormData((prev) => ({ ...prev, endTime: v }));
                    if (errors.endTime) setErrors((e) => ({ ...e, endTime: '' }));
                  }}
                  minTime={formData.startTime || undefined}
                  placeholder="Select end time"
                  className={cn('h-12 [&_button]:h-12 [&_button]:border-2 [&_button]:transition-all [&_button]:duration-300', errors.endTime && '[&_button]:border-destructive')}
                  aria-invalid={!!errors.endTime}
                />
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime}</p>}
                {formData.duration > 0 && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <Clock className="size-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Duration: {Math.floor(formData.duration / 60)}h {formData.duration % 60}m</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location and Capacity Section */}
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <MapPin className="size-5 text-white" />
              </div>
              Location & Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-blue-500" />
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Phnom Penh, Kandal..."
                  className={cn(
                    'h-12 text-base transition-all duration-300 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                    errors.location && 'border-destructive aria-invalid:ring-destructive/20'
                  )}
                  aria-invalid={!!errors.location}
                />
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullAddress" className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-blue-500" />
                  Full Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullAddress"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  placeholder="Street, building, or venue name"
                  className={cn(
                    'h-12 text-base transition-all duration-300 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                    errors.fullAddress && 'border-destructive aria-invalid:ring-destructive/20'
                  )}
                  aria-invalid={!!errors.fullAddress}
                />
                {errors.fullAddress && <p className="text-sm text-destructive">{errors.fullAddress}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="size-4 text-blue-500" />
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, category: value }));
                    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      'h-12 w-full text-base border-2 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                      errors.category && 'border-destructive'
                    )}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-base py-3">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-semibold flex items-center gap-2">
                  <Users className="size-4 text-blue-500" />
                  Capacity <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min={1}
                  className={cn(
                    'h-12 text-base transition-all duration-300 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                    errors.capacity && 'border-destructive aria-invalid:ring-destructive/20'
                  )}
                  aria-invalid={!!errors.capacity}
                />
                {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
              </div>
            </div>

            <div className="pt-5 border-t border-border/50">
              <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-border/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isPublic ?? true}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="size-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 peer-checked:border-blue-500 peer-checked:bg-blue-600 transition-all duration-300 flex items-center justify-center">
                    <CheckCircle2 className="size-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">Public Event</span>
                  <p className="text-xs text-muted-foreground">Make this event visible to everyone</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Create Agendas Section */}
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <ListChecks className="size-5 text-white" />
              </div>
              Event Agenda
              {agendas.length > 0 && (
                <span className="ml-auto text-sm font-normal px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {agendas.length} item{agendas.length > 1 ? 's' : ''}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {agendas.length > 0 && (
              <div className="space-y-4 mb-5">
                {agendas.map((agenda, index) => (
                  <div key={agenda.id} className="rounded-2xl border-2 border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-5 space-y-4 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-8 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-md">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold text-foreground">Agenda Item</h3>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveAgenda(agenda.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="What's happening at this time?"
                      value={agenda.title}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'title', e.target.value)}
                      className="h-12 text-base border-2 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                    <textarea
                      placeholder="Add more details about this agenda item..."
                      value={agenda.description}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'description', e.target.value)}
                      rows={2}
                      className="flex min-h-20 w-full rounded-xl border-2 border-input bg-transparent px-4 py-3 text-base shadow-xs outline-none placeholder:text-muted-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 resize-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start Time</Label>
                        <TimePicker
                          value={agenda.startTime}
                          onChange={(v) => handleUpdateAgenda(agenda.id, 'startTime', v)}
                          placeholder="Select"
                          className="[&_button]:h-11 [&_button]:border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">End Time</Label>
                        <TimePicker
                          value={agenda.endTime}
                          onChange={(v) => handleUpdateAgenda(agenda.id, 'endTime', v)}
                          minTime={agenda.startTime || undefined}
                          placeholder="Select"
                          className="[&_button]:h-11 [&_button]:border-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-14 border-2 border-dashed border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all duration-300 group" 
              onClick={handleAddAgenda}
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 mr-3 group-hover:scale-110 transition-transform duration-300">
                <Plus className="size-4 text-blue-600" />
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Add agenda item</span>
            </Button>
          </CardContent>
        </Card>

        {errors.submit && (
          <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-destructive/10">
              <X className="size-4" />
            </div>
            {errors.submit}
          </div>
        )}

        {/* Submit Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-8 -mx-4 px-4 md:-mx-6 md:px-6">
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="px-6 h-12 text-base border-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createEventMutation.isPending} 
              className="px-8 h-12 text-base gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-300 disabled:opacity-70"
            >
              {createEventMutation.isPending ? (
                <>
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {submitStatus === 'uploading' ? 'Uploading image...' : 'Creating event...'}
                </>
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Staff Selection Modal */}
      {showStaffModal && (
        <StaffSelectionModal
          staffList={staffList}
          selectedStaff={selectedStaff}
          onToggle={handleStaffToggle}
          onRoleChange={handleStaffRoleChange}
          onClose={() => setShowStaffModal(false)}
          onConfirm={() => setShowStaffModal(false)}
        />
      )}
    </div>
  );
};

// Staff Selection Modal Component
const StaffSelectionModal = ({ staffList, selectedStaff, onToggle, onRoleChange, onClose, onConfirm }) => {
  const STAFF_ROLES = ['Coordinator', 'Event Manager', 'Support Staff'];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-blue-50 dark:bg-blue-950/30 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
              <UserPlus className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Select Staff Members</h3>
              <p className="text-sm text-muted-foreground">Choose team members to help manage your event</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
          >
            <X className="size-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                <Users className="size-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">No staff members available in this organization</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staffList.map((staff) => {
                const isSelected = selectedStaff.some((s) => s.user_id === staff.user_id);
                const selectedEntry = selectedStaff.find((s) => s.user_id === staff.user_id);
                return (
                  <div
                    key={staff.user_id}
                    className={cn(
                      'flex items-center gap-4 p-4 border-2 rounded-xl transition-all duration-300',
                      isSelected
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                        : 'border-border hover:border-blue-200 dark:hover:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <label className="flex items-center gap-4 cursor-pointer flex-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggle(staff)}
                          className="sr-only peer"
                        />
                        <div className={cn(
                          "size-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center",
                          isSelected 
                            ? "border-blue-500 bg-blue-600" 
                            : "border-slate-300 dark:border-slate-600"
                        )}>
                          {isSelected && <CheckCircle2 className="size-4 text-white" />}
                        </div>
                      </div>
                      <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{staff.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{staff.email}</p>
                      </div>
                    </label>
                    {isSelected && onRoleChange && (
                      <select
                        value={selectedEntry?.role || 'Coordinator'}
                        onChange={(e) => onRoleChange(staff.user_id, e.target.value)}
                        className="px-4 py-2.5 border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STAFF_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t border-border/50 bg-slate-50/50 dark:bg-slate-800/50">
          <p className="text-sm text-muted-foreground">
            {selectedStaff.length > 0 ? (
              <span className="font-medium text-blue-600 dark:text-blue-400">{selectedStaff.length} member{selectedStaff.length > 1 ? 's' : ''} selected</span>
            ) : (
              'No members selected'
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-border rounded-xl text-foreground font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all duration-300"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
