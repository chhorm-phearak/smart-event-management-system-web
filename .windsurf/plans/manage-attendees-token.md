# Manage attendees token fix plan
This plan updates ManageAttendeesPage to pull authentication from the shared utilities so attendee data loads with real credentials.

## Steps
1. Review how authService persists tokens during login to confirm the expected storage key and format.
2. Refactor ManageAttendeesPage to read the token via `getAccessToken` (or reuse the configured axios instance) instead of directly accessing `localStorage`.
3. Verify pagination and search requests continue to work after the refactor, adjusting request helpers as needed.
4. Manually test the page flow (with and without an active token) to ensure errors render correctly and authenticated data appears.
