# RAG Prompt Evaluation with MLFlow and Feast

This example demonstrates how to use MLFlow to evaluate different RAG (Retrieval-Augmented Generation) prompt templates with Feast as the feature store.

## Overview

The example shows how to:
- Retrieve documents using Feast's vector search capabilities
- Track different prompt templates in MLFlow
- Evaluate prompt performance using various metrics
- Register the best-performing prompt template in MLFlow

## Prerequisites

- Python 3.10 or later
- Feast installed with MLFlow support: `pip install 'feast[mlflow]'`
- Sentence Transformers: `pip install sentence-transformers`

## Running the Example

1. Set up a feature repository with Milvus or another vector-capable online store
2. Run the example:
   ```
   python rag_prompt_evaluation.py
   ```

3. View the results in the MLFlow UI:
   ```
   mlflow ui
   ```

## Example Output

The example will output the best-performing prompt template based on the F1 score, and register it in MLFlow as a model.
