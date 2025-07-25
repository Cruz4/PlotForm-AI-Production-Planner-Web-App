# Firebase Troubleshooting Guide

This guide helps with common configuration and deployment issues. I cannot make these changes for you; they must be done in the Google Cloud and Firebase consoles.

## "Unable to verify app" / "Domain not authorized" (Error during Sign-In)

If you see security errors during login, it means you need to authorize your application's URLs. You must authorize **all of your application's potential URLs.**

### Step 1: Confirm Your Project ID & URLs

*   **Google Cloud Project ID:** `plotform-ai-planner`
*   **Live URL 1 (App Hosting):** `plotform-ai-planner--plotform-ai-planner.us-central1.hosted.app`
*   **Live URL 2 (Firebase Hosting):** `plotform-ai-planner.web.app`
*   **Local (Development) URL:** `6000-firebase-studio-1752984711202.cluster-ux5mmlia3zhhask7riihruxydo.cloudworkstations.dev`

### Step 2: Open the Correct Google Cloud Page

[**Click this link to open the Credentials page for your project.**](https://console.cloud.google.com/apis/credentials?project=plotform-ai-planner)

### Step 3: Authorize Domains for Your API Key (Client-Side) - FIX FOR 403 AI ERROR

This is the most common fix for AI features failing on the deployed site.

1.  On the Credentials page, under "API Keys", find the key named **"Browser key (auto created by Firebase)"**.
2.  Click on its name to edit it.
3.  Under "Application restrictions", ensure **HTTP referrers (web sites)** is selected.
4.  Under "Website restrictions", click **ADD**.
5.  In the "New referrer" field, paste your **Live URL 1 (App Hosting)**: `plotform-ai-planner--plotform-ai-planner.us-central1.hosted.app`
6.  Click **Done**.
7.  Click **ADD** again.
8.  In the "New referrer" field, paste your **Live URL 2 (Firebase Hosting)**: `plotform-ai-planner.web.app`
9.  Click **Done**.
10. Click **ADD** again.
11. In the "New referrer" field, paste your **Local (Development) URL**: `6000-firebase-studio-1752984711202.cluster-ux5mmlia3zhhask7riihruxydo.cloudworkstations.dev`
12. Click **Done**.
13. **CRITICAL:** Click **ADD** again.
14. In the "New referrer" field, paste your project's alternate Firebase hosting URL: `plotform-ai-planner.firebaseapp.com`
15. Click **Done**, and then click **Save** at the bottom of the page.

### Step 4: Authorize Domains for OAuth (Used by Google Sign-In)

1.  On the same Credentials page, under "OAuth 2.0 Client IDs", find and click on the one named **"Web client (auto created by Google Service)"**. This is the correct one to edit.
2.  Look for the **Authorized JavaScript origins** section.
3.  Click **+ ADD URI**.
4.  In the "URI" field, paste your **Live URL 1 (App Hosting)**, making sure it starts with `https://`: `https://plotform-ai-planner--plotform-ai-planner.us-central1.hosted.app`
5.  Click **+ ADD URI** again.
6.  In the "URI" field, paste your **Live URL 2 (Firebase Hosting)**, making sure it starts with `https://`: `https://plotform-ai-planner.web.app`
7.  Click **+ ADD URI** again.
8.  In the new field, paste your **Local (Development) URL**, making sure it starts with `https://`: `https://6000-firebase-studio-1752984711202.cluster-ux5mmlia3zhhask7riihruxydo.cloudworkstations.dev`
9.  Click **+ ADD URI** again.
10. In the new "URI" field, paste your project's alternate Firebase hosting URL: `https://plotform-ai-planner.firebaseapp.com`
11. Click **Save** at the bottom of the page.

### Step 5: Authorize the Redirect URI for Google Sign-In (Fix for `redirect_uri_mismatch`)

1.  While still editing the **Web client (auto created by Google Service)** from the previous step, scroll down to the **Authorized redirect URIs** section.
2.  Click **+ ADD URI**.
3.  In the "URI" field that appears, paste this exact URL: `https://plotform-ai-planner.firebaseapp.com/__/auth/handler`
4.  Click **Save** at the bottom of the page.

### Step 6: Authorize the Domain in Firebase Authentication (Final Step)

This final step is required to fix the "domain not authorized for OAuth operations" error that appears in the app.

1.  [**Click this link to open the Firebase Authentication Settings page.**](https://console.firebase.google.com/project/plotform-ai-planner/authentication/settings)
2.  Select the **"Authorized domains"** tab.
3.  Click the **"Add domain"** button.
4.  In the "Domain" field, paste the domain for **Live URL 1 (App Hosting)**: `plotform-ai-planner--plotform-ai-planner.us-central1.hosted.app`
5.  Click **Add**.
6.  Click the **"Add domain"** button again.
7.  In the "Domain" field, paste the domain for **Live URL 2 (Firebase Hosting)**: `plotform-ai-planner.web.app`
8.  Click **Add**.
9.  Click the **"Add domain"** button again.
10. In the "Domain" field, paste the domain for your **Local (Development) URL**: `6000-firebase-studio-1752984711202.cluster-ux5mmlia3zhhask7riihruxydo.cloudworkstations.dev`
11. Click **Add**.

After completing these steps, please do a hard refresh of your application tab (Ctrl+Shift+R or Cmd+Shift+R). It may take a minute for the settings to take effect, but your sign-in and AI features should now work in both your local and deployed environments.

---

## "403 Forbidden" or "Permission Denied" on the AI Plan Generator (Server-Side Error)

If the AI Plan Generator on the dashboard fails, it's almost always a permissions or configuration issue on your Google Cloud project. Please try these two solutions in order.

### Solution 1: Grant the "Vertex AI User" Role

The server needs permission to use the AI services.

1.  **Open the IAM & Admin Page:** [**Click this link to open the IAM (Permissions) page for your project.**](https://console.cloud.google.com/iam-admin/iam?project=plotform-ai-planner)
2.  **Grant Access:**
    *   Click the **+ GRANT ACCESS** button.
    *   In the **"New principals"** field, paste this exact email address:
        `firebase-app-hosting-compute@plotform-ai-planner.iam.gserviceaccount.com`
    *   In the **"Assign roles"** section, search for and select the **"Vertex AI User"** role.
    *   Click **Save**.
    *   If you see a message that the principal already exists, that's okay! It means this step is already done. Proceed to Solution 2.

### Solution 2: Enable the Vertex AI API

Even with the right permissions, the AI service itself must be enabled for your project. This is the most common cause of "403 Forbidden" errors.

1.  **Open the Vertex AI API Page:** [**Click this link to go directly to the Vertex AI API page for your project.**](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=plotform-ai-planner)
2.  **Enable the API:**
    *   Look for a blue **ENABLE** button near the top. If you see it, click it. The process may take a minute.
    *   If the button says **MANAGE** instead, the API is already enabled, and this is not the source of the error.
3.  **Wait a Minute:** It can take a minute or two for the change to take effect.
4.  **Try the AI Generator Again:** Go back to the app and try generating a plan.

**If it still fails:** The last possibility is that **Billing is not enabled** for your project. AI services require a billing account to be linked, even if your usage is within the free tier. Please ensure a billing account is active for the `plotform-ai-planner` project in the Google Cloud Console.

---

## Deployment Prompts

### "? Would you like to delete these indexes?"

During `firebase deploy`, you may be asked:
`i firestore: The following indexes are defined in your project but are not present in your firestore indexes file: ... ? Would you like to delete these indexes? (y/N)`

**What this means:** Your local `firestore.indexes.json` file is the source of truth. An old, unused index exists on the Firebase server that is no longer in your local file. The deploy process wants to clean it up.

**What to do:** This is safe. **Type `y` and press Enter.** This will delete the old index from the server, and you will not see this prompt again for this specific index. This is a good thing and part of the cleanup process.
