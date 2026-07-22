# Gift Ledger Roadmap

Gift Ledger is production-live with a Netlify frontend, Unraid-hosted backend API, PostgreSQL database, SSL via Nginx Proxy Manager, user authentication, named gift lists, connections, gift claims, themes, and responsive list/table UI.

This roadmap tracks planned enhancements, quality-of-life improvements, and future polish items.

---

## Phase 1 — High-Value Quality-of-Life Improvements

### 1. Gift Item Priority

Add a priority field to each gift item so users can communicate which gifts matter most.

Suggested priority values:

* High
* Medium
* Low

Expected behavior:

* Priority can be selected when creating a gift item.
* Priority can be edited later.
* Priority appears in the Gift Ideas table.
* High-priority items can be sorted to the top.
* Connected users can see priority when viewing another user’s list.

Technical notes:

* Add a `priority` field to `GiftItem`.
* Recommended default: `Medium`.
* Consider using an enum for consistent values.

---

### 2. Sort and Filter Controls

Add table controls to make larger lists easier to manage.

Gift Ideas filters:

* Search by item name
* Filter by priority
* Filter by active/archived status
* Sort by priority
* Sort by newest
* Sort by quantity

List Library filters:

* Search by list name
* Filter by occasion
* Sort by item count
* Sort default list first

---

### 3. Password Reset

Allow users to reset their password if they forget it.

Suggested flow:

1. User clicks “Forgot password?” on the login page.
2. User enters their email address.
3. System creates a secure password reset token.
4. User receives a reset link by email.
5. User sets a new password.
6. Token expires after a short window.

Technical notes:

* Requires email sending.
* Possible providers:

  * Resend
  * SendGrid
  * Mailgun
  * SMTP through Microsoft 365 / GoDaddy
* Reset tokens should be hashed before being stored.
* Tokens should expire automatically.

---

### 4. Mobile CSS Cleanup

Clean up the responsive CSS added during the mobile table/card conversion.

Cleanup goals:

* Consolidate duplicate mobile table CSS.
* Remove unnecessary `!important` overrides where possible.
* Preserve the current mobile card behavior.
* Make the List Library and Gift Ideas responsive CSS easier to maintain.

---

## Phase 2 — Better Gift Tracking

### 5. Gift Item Status

Add clearer item status handling.

Suggested statuses:

* Active
* Reserved
* Purchased
* Archived

Expected behavior:

* Owners can see whether items are still active.
* Connected users can better understand what is available.
* Owner privacy should still be protected where needed.

---

### 6. List Occasion Date

Allow each gift list to have an optional date.

Examples:

* Christmas 2026 — December 25, 2026
* Birthday — August 10
* Housewarming — custom date

Expected behavior:

* Date can be added when creating or editing a list.
* Dashboard can surface upcoming lists.
* Lists can be sorted by upcoming occasion date.

---

### 7. Price Field

Add optional price information to gift items.

Suggested fields:

* Estimated price
* Price notes

Expected behavior:

* Users can add a general price estimate.
* Connected users can sort or scan gifts by price range.
* Price remains optional.

---

### 8. Image URL Support

Allow users to add an image URL to a gift item.

Expected behavior:

* User can paste an image URL when creating or editing an item.
* Gift Ideas table/card can show a small image preview.
* Connected list views can display item images.

Recommended first version:

* Image URL only.
* No image uploads yet.

Future version:

* Uploaded image storage.
* Link preview/Open Graph image extraction.

---

## Phase 3 — Sharing and Collaboration

### 9. Invite Users by Link

Allow users to invite others through a shareable connection link.

Suggested flow:

1. User creates an invite link.
2. User sends the link to another person.
3. Recipient signs in or registers.
4. Connection request is created or accepted.

Expected behavior:

* Makes onboarding easier than searching by email.
* Useful for family members and friends.

---

### 10. List Visibility Controls

Give users more control over who can see each list.

Suggested visibility options:

* Private
* Visible to all accepted connections
* Visible only to selected connections

Expected behavior:

* Each list can have its own visibility setting.
* Default should remain private or connection-only.
* Connected users only see lists they are allowed to view.

---

### 11. Claim Notes

Allow connected users to add private notes to their own claims.

Examples:

* Bought from Target
* Arriving December 18
* Splitting with Mom

Privacy rule:

* Claim notes should be visible only to the claiming user.
* The list owner should not see private claim notes.

---

## Phase 4 — Dashboard Improvements

### 12. Dashboard Quick Actions

Add a dedicated Quick Actions card instead of putting buttons in the hero.

Suggested actions:

* Create new list
* Add item to default list
* View connections
* Review connected lists

Expected behavior:

* Keeps the hero clean.
* Gives users a practical launch point from the dashboard.

---

### 13. Dashboard Activity Feed

Add a small activity feed for recent app actions.

Possible activity examples:

* You created a new list.
* You added an item to a list.
* A new connection was accepted.
* A connected list has available items.

Privacy rule:

* Do not reveal who reserved or purchased a gift to the list owner.

---

### 14. Dashboard Gift Stats

Add more useful dashboard stats.

Possible stats:

* Total lists
* Total active items
* High-priority items
* Connected users
* Items reserved by the current user
* Items purchased by the current user

---

## Phase 5 — Theme and UI Polish

### 15. Theme Preview Improvements

Improve the theme selection experience.

Possible improvements:

* Larger theme preview cards
* Better mobile theme layout
* Visual preview of colors before saving
* Seasonal default theme option

---

### 16. Responsive UI Final Cleanup

Review all major pages across desktop, tablet, and mobile.

Pages to review:

* Dashboard
* My Lists
* List Detail
* Connections
* Settings
* Login/Register

Cleanup goals:

* Consistent spacing
* Consistent table/card behavior
* Cleaner mobile forms
* Better tablet navbar behavior
* Reduced duplicate CSS

---

## Recommended Build Order

1. Gift item priority
2. Sort and filter controls
3. Password reset
4. Mobile CSS cleanup
5. List occasion date
6. Gift item status
7. Price field
8. Image URL support
9. Invite users by link
10. List visibility controls
11. Claim notes
12. Dashboard quick actions
13. Dashboard activity feed
14. Dashboard gift stats
15. Theme preview improvements
16. Responsive UI final cleanup

---

## Current Backlog Notes

* Gift Ledger is already production-live.
* Public API is available at `https://api.gift-ledger.jorgesotocoder.com`.
* Local network API timeouts are likely related to LAN hairpin/NAT loopback behavior.
* Recommended long-term network fix: local DNS rewrite for hosted subdomains pointing to the Nginx Proxy Manager LAN IP.
* Mobile List Library card CSS currently uses final override rules and should be cleaned up later.
