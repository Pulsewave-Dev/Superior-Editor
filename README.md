# Superior Web Editor

## 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Pulsewave-Dev/Superior)

## ✨ No Database Required!

This editor uses **file-based synchronization** - share JSON files and the web editor reads them directly!

```
MC Server → JSON Files → File Share → Web Editor (Vercel)
 (Plugin)    (Local)     (Optional)    (Next.js)
```

## 📦 Setup

### 1. Deploy to Vercel

1. Fork this repository
2. Click "Deploy to Vercel" button
3. No environment variables needed!
4. Deploy!

### 2. Configure File Sharing (Optional)

The plugin generates JSON files in `plugins/Superior/editor-sessions/`. You can:

**Option A: Local Testing**
- Access files locally at `localhost:3000`
- Upload JSON files to the web editor manually

**Option B: File Hosting**
- Upload JSON files to GitHub Gist, Pastebin, or file host
- Web editor can fetch from public URLs

**Option C: Direct Share**
- Copy JSON content and paste into web editor

## 🔗 URL Structure

URLs follow Phoenix's pattern:
```
https://editor.mememc.club/[6-char-id]/[server-uuid]
```

Generate sessions in-game:
```
/superior editor
```

## 🎯 Commands

- `/superior editor` - Start editor session & get URL
- `/superior editor-update` - Apply pending changes from web
- `/superior editor-close` - Close editor session

## 🎨 Features

- **No Database** - Works with simple JSON files
- **File-Based Sync** - Changes saved to JSON files
- **Manual Updates** - Control when changes are applied
- **Rank Editor** - Create and modify ranks with live preview
- **Tag Editor** - Design custom player tags
- **Secure Access** - Random 6-character session IDs
- **Mobile Friendly** - Works on all devices

## 🔧 Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 File Structure

The plugin creates these JSON files in `plugins/Superior/editor-sessions/`:

- `{editorId}_session.json` - Session metadata
- `{editorId}_data.json` - Current ranks/tags data
- `{editorId}_changes.json` - Pending changes from web

## 📚 How It Works

1. Admin runs `/superior editor` in-game
2. Plugin generates session and creates `{editorId}_data.json`
3. Plugin auto-syncs data to JSON file every 5 seconds
4. Admin shares URL with editor
5. Editor reads data from JSON file (uploaded or URL)
6. User makes changes in web editor
7. Changes saved to `{editorId}_changes.json`
8. Admin runs `/superior editor-update` to apply changes
9. Changes applied in-game immediately

**No database, no API, just files!**

