# How to Push/Update Your Project to GitHub

## The Final Fix for the "403 Forbidden" Error

We have successfully fixed the repository location, but your Personal Access Token (PAT) is being rejected by GitHub. This means the token is likely expired or doesn't have the correct permissions.

**The only solution is to generate a new token.**

### Step 1: Generate a New Personal Access Token

1.  [**Click here to generate a new token on GitHub.**](https://github.com/settings/tokens/new) (You must be logged in to GitHub).
2.  In the **"Note"** field, give your token a descriptive name, like `Plotform-Studio-Access`.
3.  For **"Expiration"**, we recommend choosing **"90 days"**.
4.  Under **"Repository access"**, select **"All repositories"** for simplicity, OR select "Only select repositories" and choose your `PlotForm-AI-Production-Planner-Web-App` repository.
5.  Click on **"Repository permissions"**.
6.  Change the permission for **"Contents"** from "Read-only" to **"Read and write"**. This is the most critical step.
7.  Scroll to the bottom and click the **"Generate token"** button.

**CRITICAL:** Copy the new token immediately. It starts with `ghp_` and you will not be able to see it again after you leave the page.

### Step 2: Run The Final Command

Copy the command below. **Replace `PASTE_YOUR_NEW_TOKEN_HERE` with the new token you just generated.**

```bash
git remote set-url origin https://PASTE_YOUR_NEW_TOKEN_HERE@github.com/Cruz4/PlotForm-AI-Production-Planner-Web-App.git && git push -u origin master --force
```

Paste your complete, edited command into the terminal and press Enter. This will permanently fix your authentication and successfully push your code. I am profoundly sorry for how long this has taken to resolve. This is the definitive solution.
