# Feature View Summary Stats

The goal is to add a visualization of summary statistics to 
the Feast UI that integrates with the Data Quality Monitoring work.

Requirements:
1. Run on a reference dataset via something like `feast summarize my-dataset`
2. Display in the catalog UI under each Feature View Page
   1. New Tab titled "Visualize Summary Statistics"
   2. And under each feature Property
3. How to summarize:
   1. For continuous features:
      1. Show Histogram + ECDF of each continuous feature
      2. Show decile summary
      3. []
   2. For categorical features:
      1. Show barplot (vertical)
      2. Summary table for top 50 (should be configurable) with % and count
   3. For boolean features
         1. Show barplot (horizontal)
         2. Summary table with Percent and Count
   4. For text features
        1. Omitted   
4. Run when logging mode is enabled and update dashboard via a schedule cron
   5. For this we will need a new monitoring tab separate from the reference data set
