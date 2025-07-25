# How to Check AI Usage & Costs

This guide explains how to view your usage and potential costs for the Generative AI features within the PlotForm Planner application. All AI usage is billed directly to your own Google Cloud project.

### Step 1: Confirm Your Project ID

Your Google Cloud Project ID is **`episode-planner-app`**. Please use this ID for all steps.

### Step 2: Open the Correct Google Cloud Page

The easiest way to see everything is to go directly to the dashboard for the specific AI service being used.

[**Click this link to open the Generative Language API Dashboard.**](https://console.cloud.google.com/apis/dashboard?project=episode-planner-app&service=generativelanguage.googleapis.com)

### Step 3: Analyze Your Usage

On the page that opens, you'll see several tabs near the top. Here's what they mean:

*   **Metrics:** This is the main view. It shows you charts of your API usage over time. You can see the number of requests, errors, and latency. This is the best place to see how much the AI features are being used.
*   **Quotas:** This tab shows your usage limits. For the Generative Language API, this is typically measured in "Requests per minute." You can see your current usage against these limits.
*   **Cost:** This tab provides an estimate of the costs associated with your usage of this specific API.

### Step 4: View Detailed Billing Reports

For a more comprehensive overview of all costs in your project (including Firestore, App Hosting, etc.), you should look at the main billing report.

1.  [**Click this link to go to the Billing Reports page for your project.**](https://console.cloud.google.com/billing/reports?project=episode-planner-app)
2.  On this page, you can see costs broken down by service. Look for line items related to "Generative Language API" to see the specific costs for the AI features.
3.  You can adjust the time range and group the data in different ways to get a clear picture of your spending.

**Note on Free Tiers:** Google Cloud often provides a generous free tier for its services, including the Generative Language API. It's possible for your usage to be well within this free tier, resulting in no cost. The billing report will show you both your usage and whether it was covered by free tier credits.
