import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const filePath = join(__dirname, 'src', 'pages', 'groups', 'GroupDetailPage.jsx');
let data = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replacements = [
  [
    "import { useAuth } from '@/context/AuthContext';",
    "import { useAuth } from '@/context/AuthContext';\nimport { useLanguage } from '@/context/LanguageContext';"
  ],
  [
    "  const { user } = useAuth();",
    "  const { user } = useAuth();\n  const { t, locale } = useLanguage();"
  ],
  [
    "  const formatDate = (dateString) => {\n    if (!dateString) return '';\n    const date = new Date(dateString);\n    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });\n  };",
    "  const formatDate = (dateString) => {\n    if (!dateString) return '';\n    const date = new Date(dateString);\n    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });\n  };"
  ],
  [
    "        name: groupData.name || 'Unknown Group',",
    "        name: groupData.name || t('groups.unknownGroup'),"
  ],
  [
    "        description: groupData.description || 'No description available',",
    "        description: groupData.description || t('groups.noDescription'),"
  ],
  [
    "          title: event.title || 'Untitled Event',",
    "          title: event.title || t('groups.untitledEvent'),"
  ],
  [
    "          date: new Date(event.start_time).toLocaleDateString(),",
    "          date: new Date(event.start_time).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),"
  ],
  [
    "          time: new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),",
    "          time: new Date(event.start_time).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),"
  ],
  [
    "          location: event.location || 'Location TBD',",
    "          location: event.location || t('groups.locationTbd'),"
  ],
  [
    "          category: event.category || 'General',",
    "          category: event.category || 'general',"
  ],
  [
    "          'Unknown User';",
    "          t('groups.unknownUser');"
  ],
  [
    "        email: member.email || 'No email',",
    "        email: member.email || t('groups.noEmail'),"
  ],
  [
    "        role: member.role || 'Member',",
    "        role: member.role || 'Member',"
  ],
  [
    "        <p className=\"text-gray-500 text-lg\">Group not found</p>",
    "        <p className=\"text-gray-500 text-lg\">{t('groups.groupNotFound')}</p>"
  ],
  [
    "          Back to Groups\n        </button>",
    "          {t('groups.backToGroups')}\n        </button>"
  ],
  [
    "        <span className=\"font-medium\">Back to Groups</span>",
    "        <span className=\"font-medium\">{t('groups.backToGroups')}</span>"
  ],
  [
    "                  <span className=\"font-medium text-gray-700\">{group.members} Members</span>",
    "                  <span className=\"font-medium text-gray-700\">{t('groups.members', { count: group.members })}</span>"
  ],
  [
    "                  <span className=\"font-medium text-gray-700\">{group.events} Events</span>",
    "                  <span className=\"font-medium text-gray-700\">{t('groups.events', { count: group.events })}</span>"
  ],
  [
    "                  <span className=\"font-medium text-gray-700\">Created {formatDate(group.createdDate)}</span>",
    "                  <span className=\"font-medium text-gray-700\">{t('groups.created', { date: formatDate(group.createdDate) })}</span>"
  ],
  [
    "              <span>Create Event</span>",
    "              <span>{t('groups.createEvent')}</span>"
  ],
  [
    "              Events ({events.length})\n            </button>",
    "              {t('groups.eventsTab', { count: events.length })}\n            </button>"
  ],
  [
    "              Members ({members.length})\n            </button>",
    "              {t('groups.membersTab', { count: members.length })}\n            </button>"
  ],
  [
    "                  <p className=\"text-gray-500 text-lg mb-2\">No events yet</p>",
    "                  <p className=\"text-gray-500 text-lg mb-2\">{t('groups.noEventsYet')}</p>"
  ],
  [
    "                  <p className=\"text-gray-400 text-sm mb-4\">Be the first to create an event for this group!</p>",
    "                  <p className=\"text-gray-400 text-sm mb-4\">{t('groups.beFirstToCreate')}</p>"
  ],
  [
    "                          <span className=\"inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium\">\n                            {event.category}\n                          </span>",
    "                          <span className=\"inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium\">\n                            {t('events.allEvents.categories.' + (event.category?.toLowerCase() || 'other'))}\n                          </span>"
  ],
  [
    "                          <span>Attendance</span>",
    "                          <span>{t('groups.attendance')}</span>"
  ],
  [
    "                            <span>{event.registered} / {event.maxAttendees}</span>",
    "                            <span>{t('groups.registered', { registered: event.registered, max: event.maxAttendees })}</span>"
  ],
  [
    "                  <p className=\"text-gray-500 text-lg\">No members yet</p>",
    "                  <p className=\"text-gray-500 text-lg\">{t('groups.noMembersYet')}</p>"
  ],
  [
    "                        <p className=\"text-xs text-gray-400 mt-1\">Joined {formatDate(member.joinedDate)}</p>",
    "                        <p className=\"text-xs text-gray-400 mt-1\">{t('groups.joined', { date: formatDate(member.joinedDate) })}</p>"
  ],
  [
    "                            <span className=\"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800\">\n                              Admin\n                            </span>",
    "                            <span className=\"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800\">\n                              {t('groups.admin')}\n                            </span>"
  ],
  [
    "                            <span className=\"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800\">\n                              Moderator\n                            </span>",
    "                            <span className=\"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800\">\n                              {t('groups.moderator')}\n                            </span>"
  ]
];

let allOk = true;
for (const [oldStr, newStr] of replacements) {
  const reg = new RegExp(escapeRegExp(oldStr), 'g');
  const matches = data.match(reg);
  if (!matches) {
    console.warn('NOT FOUND:', oldStr.slice(0, 100));
    allOk = false;
  } else if (matches.length > 1) {
    console.warn('MULTIPLE MATCHES:', oldStr.slice(0, 100), matches.length);
  }
  data = data.replace(reg, newStr);
}

writeFileSync(filePath, data, 'utf8');
console.log(allOk ? 'All replacements applied.' : 'Some replacements were not found.');
