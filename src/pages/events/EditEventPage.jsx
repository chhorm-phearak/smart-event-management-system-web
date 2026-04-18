import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronLeft, Plus, X, Calendar as CalendarIcon, MapPin, Upload, Type, AlignLeft, Users, Clock, Tag, FileText, UserPlus, ListChecks, Pencil, Image } from 'lucide-react';
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

export const EditEventPage = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const organizationId = user?.organization_id ?? user?.organizationId ?? user?.organization?.id ?? getOrganizationId() ?? null;
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      console.log('Fetching event with ID:', eventId);
      const response = await eventService.getEventById(eventId);
      console.log('Event API Response:', response);
      const event = response?.data?.event || response?.data || response?.event || response;
      console.log('Extracted Event Data:', event);
      return event;
    },
    enabled: !!eventId,
  });

  const { data: staffListData, isLoading: staffLoading, isError: staffError } = useQuery({
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
  });
  const staffList = staffListData ?? [];

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
    'Summit',
    'Other',
  ];

  useEffect(() => {
    if (eventData) {
      console.log('Populating form with event data:', eventData);
      
      const startDate = new Date(eventData.start_time);
      const endDate = new Date(eventData.end_time);
      
      const eventDateStr = startDate.toISOString().split('T')[0];
      const startTimeStr = startDate.toTimeString().slice(0, 5);
      const endTimeStr = endDate.toTimeString().slice(0, 5);

      const populatedFormData = {
        title: eventData.title || '',
        shortDescription: eventData.short_description || '',
        description: eventData.long_description || '',
        eventDate: eventDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        location: eventData.location || '',
        fullAddress: eventData.full_address || '',
        category: eventData.category || '',
        capacity: eventData.capacity || 400,
        duration: eventData.duration || 0,
        image: null,
        isPublic: eventData.is_public ?? true,
      };
      
      console.log('Setting form data:', populatedFormData);
      setFormData(populatedFormData);

      if (eventData.primary_image_url) {
        console.log('Setting image preview:', eventData.primary_image_url);
        setImagePreview(eventData.primary_image_url);
      }

      if (eventData.agenda && Array.isArray(eventData.agenda)) {
        const mappedAgendas = eventData.agenda.map(item => {
          const agendaStart = new Date(item.start_time);
          const agendaEnd = new Date(item.end_time);
          return {
            id: item.id || Date.now() + Math.random(),
            title: item.title || '',
            description: item.description || '',
            startTime: agendaStart.toTimeString().slice(0, 5),
            endTime: agendaEnd.toTimeString().slice(0, 5),
          };
        });
        console.log('Setting agendas:', mappedAgendas);
        setAgendas(mappedAgendas);
      }

      if (eventData.staff && Array.isArray(eventData.staff)) {
        const mappedStaff = eventData.staff.map(s => ({
          user_id: s.user_id,
          name: [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown',
          email: s.email || '',
          role: s.role || 'Coordinator',
        }));
        console.log('Setting staff:', mappedStaff);
        setSelectedStaff(mappedStaff);
      }
      
      console.log('Form population complete');
    }
  }, [eventData]);

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

  const updateEventMutation = useMutation({
    mutationFn: async ({ payload, image }) => {
      await eventService.updateEvent(eventId, payload);
      if (image) {
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
    },
    onSuccess: () => {
      setSubmitStatus(null);
      toast.success('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      navigate('/manage-events');
    },
    onError: (error) => {
      setSubmitStatus(null);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to update event. Please try again.';
      setErrors((prev) => ({ ...prev, submit: message }));
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

    if (!organizationId) newErrors.organization = 'You need to be part of an organization to edit events.';
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
    setSubmitStatus('updating');
    setErrors((prev) => ({ ...prev, submit: '' }));

    const startDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);

    const payload = {
      organization_id: organizationId,
      group_id: eventData?.group_id || '',
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
      status: eventData?.status || 'UPCOMING',
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

    updateEventMutation.mutate({ payload, image: formData.image });
  };

  const formSections = [
    { id: 'details', label: 'Event Details', icon: FileText },
    { id: 'staff', label: 'Assign Staff', icon: UserPlus },
    { id: 'datetime', label: 'Date & Time', icon: Clock },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'agenda', label: 'Agenda', icon: ListChecks },
  ];

  if (eventLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
            <Pencil className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Edit Event
            </h1>
            <p className="text-muted-foreground mt-1">Update the details of your event.</p>
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
                      <div className="p-4">
                        <div className="grid grid-cols-7 gap-0.5 mb-2">
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
                                  !past && cell.isCurrentMonth && 'hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600',
                                  selected && 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
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
                  className={cn(errors.startTime && '[&_button]:border-destructive')}
                  aria-invalid={!!errors.startTime}
                />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
              </div>

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
                  className={cn(errors.endTime && '[&_button]:border-destructive')}
                  aria-invalid={!!errors.endTime}
                />
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime}</p>}
                {formData.duration > 0 && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                      Duration: {formData.duration} minutes
                    </span>
                  </p>
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
                placeholder="Street, building, or select from map"
                className={cn(
                  'h-12 text-base transition-all duration-300 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                  errors.fullAddress && 'border-destructive aria-invalid:ring-destructive/20'
                )}
                aria-invalid={!!errors.fullAddress}
              />
              {errors.fullAddress && <p className="text-sm text-destructive">{errors.fullAddress}</p>}
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
                      <SelectItem key={cat} value={cat}>
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
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isPublic ?? true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="size-5 rounded-md border-2 border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                />
                <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">Public event (visible to everyone)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Event Agendas Section */}
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <ListChecks className="size-5 text-white" />
              </div>
              Event Agendas
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
                  <div key={agenda.id} className="rounded-2xl border-2 border-blue-100 dark:border-blue-900/50 p-5 space-y-4 bg-blue-50/30 dark:bg-blue-950/20 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <span className="flex items-center justify-center size-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        Agenda Item
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveAgenda(agenda.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Agenda title"
                      value={agenda.title}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'title', e.target.value)}
                      className="h-11 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                    <textarea
                      placeholder="Agenda description"
                      value={agenda.description}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'description', e.target.value)}
                      rows={2}
                      className="flex min-h-20 w-full rounded-xl border-2 border-input bg-transparent px-4 py-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none transition-all duration-300"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">Start Time</Label>
                        <TimePicker
                          value={agenda.startTime}
                          onChange={(v) => handleUpdateAgenda(agenda.id, 'startTime', v)}
                          placeholder="—"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">End Time</Label>
                        <TimePicker
                          value={agenda.endTime}
                          onChange={(v) => handleUpdateAgenda(agenda.id, 'endTime', v)}
                          minTime={agenda.startTime || undefined}
                          placeholder="—"
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
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-5 py-4 text-sm text-destructive font-medium">
            {errors.submit}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pb-8 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="px-6 h-12 text-base border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateEventMutation.isPending} 
            className="px-8 h-12 text-base gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25 transition-all duration-300 disabled:opacity-70"
          >
            {updateEventMutation.isPending ? (
              <>
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {submitStatus === 'uploading' ? 'Uploading image...' : 'Updating event...'}
              </>
            ) : (
              'Update Event'
            )}
          </Button>
        </div>
      </form>

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

const StaffSelectionModal = ({ staffList, selectedStaff, onToggle, onRoleChange, onClose, onConfirm }) => {
  const STAFF_ROLES = ['Coordinator', 'Event Manager', 'Support Staff', 'Speaker Liaison', 'Volunteer Lead'];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-blue-50 dark:bg-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
              <UserPlus className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Select Staff Members</h3>
              <p className="text-sm text-muted-foreground">Choose team members to assign to this event</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
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
                      'flex items-center gap-4 p-4 border-2 rounded-2xl transition-all duration-300',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                        : 'border-border hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <label className="flex items-center gap-4 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(staff)}
                        className="size-5 text-blue-600 border-2 border-blue-300 rounded-md focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                      />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{staff.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{staff.email}</p>
                        </div>
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
