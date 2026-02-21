import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, Plus, X, Calendar as CalendarIcon, MapPin, Upload, Type, AlignLeft, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { eventService, organizationService, uploadSingle } from '@/services';
import { getApiOrigin } from '@/utils';
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

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const organizationId = user?.organization_id || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'creating' | 'uploading'
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

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

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationMembers();
    }
  }, [organizationId]);

  const fetchOrganizationMembers = async () => {
    if (!organizationId) return;
    try {
      setStaffLoading(true);
      const { data } = await organizationService.getMembers(organizationId);
      const mappedStaff = (data || []).map((member) => ({
        id: member.user_id,
        user_id: member.user_id,
        name: [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Unknown',
        email: member.email || '',
        role: 'Coordinator',
      }));
      setStaffList(mappedStaff);
    } catch (error) {
      console.error('Error fetching organization members:', error);
      setStaffList([]);
      setErrors((prev) => ({ ...prev, staff: 'Failed to load organization members' }));
    } finally {
      setStaffLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('creating');
    setErrors((prev) => ({ ...prev, submit: '' }));

    try {
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

      const createResponse = await eventService.createEvent(payload);
      const eventId =
        createResponse?.data?.id ??
        createResponse?.data?.event?.id ??
        createResponse?.id ??
        createResponse?.event?.id;

      if (eventId && formData.image) {
        setSubmitStatus('uploading');
        const uploadResponse = await uploadSingle(formData.image);
        const fileUrl = uploadResponse?.data?.file?.file_url;
        if (fileUrl) {
          const fullImageUrl = fileUrl.startsWith('http') ? fileUrl : `${getApiOrigin()}${fileUrl}`;
          await eventService.addEventImages(eventId, [fullImageUrl]);
        }
      }

      toast.success('Event created successfully');
      navigate(-1);
    } catch (error) {
      console.error('Error creating event:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to create event. Please try again.';
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
      setSubmitStatus(null);
    }
  };

  return (
    <div className="w-full">
      {/* Page Header with Back Button */}
      <div className="mb-6">
        <Button type="button" size="sm" onClick={() => navigate(-1)} className="mb-4 bg-blue-600 text-white hover:bg-blue-700">
          <ChevronLeft className="size-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
        <p className="text-muted-foreground mt-1">Fill in the details to create and publish your event.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.organization && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
            {errors.organization}
          </div>
        )}

        {/* Event Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Title of your event"
                  maxLength={150}
                  className={cn(
                    'h-10 pl-9',
                    errors.title && 'border-destructive aria-invalid:ring-destructive/20'
                  )}
                  aria-invalid={!!errors.title}
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                <p className="text-sm text-muted-foreground ml-auto">{formData.title.length}/150</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">
                Short Description <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="Brief tagline or summary"
                  className={cn(
                    'h-10 pl-9',
                    errors.shortDescription && 'border-destructive aria-invalid:ring-destructive/20'
                  )}
                  aria-invalid={!!errors.shortDescription}
                />
              </div>
              {errors.shortDescription && (
                <p className="text-sm text-destructive">{errors.shortDescription}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Full Description <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Full description of your event..."
                rows={5}
                className={cn(
                  'flex min-h-30 w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                  errors.description && 'border-destructive ring-destructive/20'
                )}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Event Image</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-64 object-cover rounded-lg border border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData((prev) => ({ ...prev, image: null }));
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="size-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Assign Staff</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStaff.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedStaff.map((staff) => (
                  <span
                    key={staff.user_id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {staff.name} {staff.role && `(${staff.role})`}
                    <button
                      type="button"
                      onClick={() => handleStaffToggle(staff)}
                      className="rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="size-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowStaffModal(true)}
              disabled={!organizationId || staffLoading}
              title={!organizationId ? 'Organization required' : undefined}
            >
              <Plus className="size-4" />
              {staffLoading ? 'Loading staff...' : 'Assign staff to support your event'}
            </Button>
            {errors.staff && <p className="text-sm text-destructive mt-2">{errors.staff}</p>}
          </CardContent>
        </Card>

        {/* Event Date and Time Section */}
        <Card>
          <CardHeader>
            <CardTitle>Event Date and Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event Date with calendar picker */}
              <div className="md:col-span-1 relative space-y-2">
                <Label htmlFor="eventDate">
                  Event Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="eventDate"
                    name="eventDate"
                    readOnly
                    value={formData.eventDate ? new Date(formData.eventDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    placeholder="Select date"
                    onClick={() => setShowCalendar(true)}
                    className={cn(
                      'h-10 cursor-pointer pr-9',
                      errors.eventDate && 'border-destructive aria-invalid:ring-destructive/20'
                    )}
                    aria-invalid={!!errors.eventDate}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                    <CalendarIcon className="size-4" />
                  </div>
                </div>
                {errors.eventDate && <p className="text-sm text-destructive">{errors.eventDate}</p>}

              {/* Calendar dropdown */}
              {showCalendar && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden="true"
                    onClick={() => setShowCalendar(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 z-50 w-[320px] rounded-xl shadow-lg border border-border bg-card overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{monthLabel}</h3>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" onClick={goPrevMonth} aria-label="Previous month">
                            <ChevronLeft className="size-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" onClick={goNextMonth} aria-label="Next month">
                            <ChevronLeft className="size-4 rotate-180" />
                          </Button>
                        </div>
                      </div>
                      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-primary" onClick={goToToday}>
                        Go to today
                      </Button>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-7 gap-0.5 mb-2">
                        {weekDays.map((day) => (
                          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
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
                                'aspect-square flex items-center justify-center text-sm rounded-md transition-colors',
                                !cell.isCurrentMonth && 'text-muted-foreground/50',
                                past && cell.isCurrentMonth && 'text-muted-foreground/50 cursor-not-allowed',
                                !past && cell.isCurrentMonth && 'hover:bg-accent',
                                selected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                                today && !selected && 'ring-2 ring-ring ring-offset-2'
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
                <Label htmlFor="startTime">
                  Start time <span className="text-destructive">*</span>
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

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="endTime">
                  End time <span className="text-destructive">*</span>
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
                  <p className="text-sm text-muted-foreground">Duration: {formData.duration} minutes</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location and Capacity Section */}
        <Card>
          <CardHeader>
            <CardTitle>Location and Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Phnom Penh, Kandal..."
                  className={cn(
                    'h-10 pl-9',
                    errors.location && 'border-destructive aria-invalid:ring-destructive/20'
                  )}
                  aria-invalid={!!errors.location}
                />
              </div>
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullAddress">
                Full Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="fullAddress"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  placeholder="Street, building, or select from map"
                  className={cn(
                    'h-10 pr-9',
                    errors.fullAddress && 'border-destructive aria-invalid:ring-destructive/20'
                  )}
                  aria-invalid={!!errors.fullAddress}
                />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.fullAddress && <p className="text-sm text-destructive">{errors.fullAddress}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
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
                      'h-10 w-full',
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
                <Label htmlFor="capacity">
                  Capacity <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min={1}
                    className={cn(
                      'h-10 pl-9',
                      errors.capacity && 'border-destructive aria-invalid:ring-destructive/20'
                    )}
                    aria-invalid={!!errors.capacity}
                  />
                </div>
                {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic ?? true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="size-4 rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm font-medium">Public event (visible to everyone)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Create Agendas Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create Agendas</CardTitle>
          </CardHeader>
          <CardContent>
            {agendas.length > 0 && (
              <div className="space-y-3 mb-4">
                {agendas.map((agenda) => (
                  <div key={agenda.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Agenda Item {agendas.indexOf(agenda) + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveAgenda(agenda.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Agenda title"
                      value={agenda.title}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'title', e.target.value)}
                      className="h-10"
                    />
                    <textarea
                      placeholder="Agenda description"
                      value={agenda.description}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'description', e.target.value)}
                      rows={2}
                      className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Start</Label>
                        <TimePicker
                          value={agenda.startTime}
                          onChange={(v) => handleUpdateAgenda(agenda.id, 'startTime', v)}
                          placeholder="—"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">End</Label>
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
            <Button type="button" variant="outline" className="w-full border-dashed" onClick={handleAddAgenda}>
              <Plus className="size-4" />
              Add agenda item
            </Button>
          </CardContent>
        </Card>

        {errors.submit && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
            {isSubmitting ? (submitStatus === 'uploading' ? 'Uploading image...' : 'Creating event...') : 'Create Event'}
          </Button>
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Select Staff Members</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {staffList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No staff members available in this organization</p>
          ) : (
            <div className="space-y-3">
              {staffList.map((staff) => {
                const isSelected = selectedStaff.some((s) => s.user_id === staff.user_id);
                const selectedEntry = selectedStaff.find((s) => s.user_id === staff.user_id);
                return (
                  <div
                    key={staff.user_id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <label className="flex items-center gap-4 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(staff)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-500">{staff.email}</p>
                      </div>
                    </label>
                    {isSelected && onRoleChange && (
                      <select
                        value={selectedEntry?.role || 'Coordinator'}
                        onChange={(e) => onRoleChange(staff.user_id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm ({selectedStaff.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
};
