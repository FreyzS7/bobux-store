# 🚀 Quick Start: Projects Feature

## ⚡ Get Started in 2 Minutes

### Step 1: Start the Development Server

**No additional Supabase configuration needed!** ✨

The app uses **Supabase Broadcast** instead of Database Replication, so you don't need early access features.

### Step 2: Run the App

```bash
npm run dev
```

### Step 3: Test the Feature

1. **Login** to your app (http://localhost:3000/login)
2. Click **"Projects"** in the navigation bar
3. Click **"New Project"** button
4. Fill in:
   - Project Name: "My First Project"
   - Icon: 🚀
   - Description: "Testing the new projects feature"
5. Click **"Create Project"**
6. You'll be redirected to your project's Kanban board!

---

## 🎯 Try These Features

### Create Tasks
1. Click the **"+ Add Task"** button in any column
2. Enter task details
3. Optionally assign to a member
4. Click "Create Task"

### Drag & Drop
1. Grab a task card
2. Drag it to another column (TODO → IN PROGRESS → COMPLETED)
3. Watch it update instantly!

### Invite a Team Member
1. Click **"Invite Member"** button
2. Enter a username (e.g., `seller1`, `manager1`, or `user1`)
3. Click "Send Invitation"

### Test Real-time (Two Browsers)
1. Open a **second browser** (or incognito window)
2. Login as the **invited user**
3. Click the **bell icon** 🔔 in the navbar
4. You'll see the invitation!
5. Click **"Accept"**
6. Now both browsers are in the same project
7. **Create a task** in one browser
8. **Watch it appear instantly** in the other! ✨

---

## 🎨 What You Can Do

### Projects
- ✅ Create unlimited projects
- ✅ Add custom icons (any emoji)
- ✅ Add descriptions
- ✅ View all your projects in a grid
- ✅ Delete projects (owners only)

### Tasks
- ✅ Create tasks in any column
- ✅ Edit task details
- ✅ Assign to team members
- ✅ Drag between columns
- ✅ Delete tasks
- ✅ See who tasks are assigned to

### Collaboration
- ✅ Invite unlimited team members
- ✅ See all project members
- ✅ Real-time updates for everyone
- ✅ Notification badges for invitations
- ✅ Accept/reject invitations

---

## 🔥 Pro Tips

1. **Emoji Icons**: Use any emoji as your project icon (🎨, 📱, 💡, 🎯, etc.)
2. **Quick Invite**: Invite members by their exact username
3. **Drag Anywhere**: You can drag tasks anywhere in the column, not just at the end
4. **Bell Icon**: Red badge shows pending invitation count
5. **Instant Updates**: No need to refresh - everything syncs automatically!

---

## ❓ Troubleshooting

### "Failed to fetch projects"
- ✅ Check that you're logged in
- ✅ Verify database is running
- ✅ Check console for errors

### Realtime not working
- ✅ Enable Realtime in Supabase Dashboard (see Step 1 above)
- ✅ Check Supabase environment variables in `.env`
- ✅ Refresh the page

### Drag-and-drop not working
- ✅ Make sure you have EDITOR or OWNER role
- ✅ Click and hold for a moment before dragging
- ✅ Try refreshing the page

### Invitation not received
- ✅ Check username spelling (case-sensitive)
- ✅ Refresh the page to see notification badge
- ✅ Click the bell icon to see pending invitations

---

## 📚 Learn More

For detailed documentation, see [PROJECTS_FEATURE.md](./PROJECTS_FEATURE.md)

---

**Enjoy your new collaborative project management system!** 🎉
