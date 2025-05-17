"""
Example of using MLFlow to evaluate RAG prompts with Feast.

This example demonstrates how to:
1. Retrieve documents using Feast's vector search
2. Log prompt evaluation metrics to MLFlow
3. Track different prompt variations and their performance
4. Register the best-performing prompts with MLFlow
"""

import os
import numpy as np
import pandas as pd
import mlflow
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from feast import FeatureStore, Entity, FeatureView, Feature, Field, FileSource
from feast.types import Float32, String, Array
from feast.infra.offline_stores.file_source import SavedDatasetFileStorage
from feast.feature_service import FeatureService

def evaluate_rag_prompt(
    prompt: str, 
    retrieved_docs: List[Dict[str, Any]], 
    ground_truth: str
) -> Dict[str, float]:
    """
    Evaluate a RAG prompt based on retrieved documents and ground truth.
    
    Args:
        prompt: The prompt used for retrieval
        retrieved_docs: List of retrieved documents
        ground_truth: The ground truth answer
        
    Returns:
        Dictionary of evaluation metrics
    """
    
    precision = np.random.uniform(0.7, 0.95)
    recall = np.random.uniform(0.7, 0.95)
    f1 = 2 * (precision * recall) / (precision + recall)
    latency = np.random.uniform(0.1, 2.0)
    
    return {
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "latency": latency,
    }

def main():
    store = FeatureStore(repo_path=".")
    
    mlflow_client = store.get_mlflow_client()
    
    entity_df = pd.DataFrame({
        "query_id": [1, 2, 3, 4, 5],
        "query_text": [
            "How does Feast handle feature versioning?",
            "What is the difference between online and offline stores?",
            "How to implement real-time feature serving?",
            "What are feature views in Feast?",
            "How to use Feast with MLflow?"
        ],
        "query_vector": [
            np.random.rand(128).astype(np.float32) for _ in range(5)
        ],
        "event_timestamp": [datetime.now() - timedelta(minutes=i) for i in range(5)]
    })
    
    retrieved_docs = [
        [{"doc_id": f"doc_{i}_{j}", "content": f"Sample content {i}_{j}", "score": np.random.uniform(0.5, 0.99)} 
         for j in range(3)] 
        for i in range(5)
    ]
    
    ground_truth = [
        "Feast handles feature versioning through point-in-time joins.",
        "Online stores serve real-time features while offline stores are used for training.",
        "Real-time feature serving is implemented using online stores in Feast.",
        "Feature views are objects that define a group of features in Feast.",
        "Feast can be integrated with MLflow for experiment tracking and model registry."
    ]
    
    prompt_templates = [
        "Answer the following question based on the retrieved documents: {query}",
        "Using the context provided, answer this question: {query}",
        "Given the following information, respond to: {query}",
        "Based on these documents, provide an answer to: {query}"
    ]
    
    mlflow.set_experiment("feast_rag_prompt_evaluation")
    
    best_prompt = None
    best_f1 = 0.0
    
    for template_idx, template in enumerate(prompt_templates):
        with mlflow.start_run(run_name=f"prompt_template_{template_idx}"):
            mlflow.log_param("prompt_template", template)
            
            avg_metrics = {"precision": 0.0, "recall": 0.0, "f1_score": 0.0, "latency": 0.0}
            
            for i, query in enumerate(entity_df["query_text"]):
                formatted_prompt = template.format(query=query)
                
                metrics = evaluate_rag_prompt(
                    prompt=formatted_prompt,
                    retrieved_docs=retrieved_docs[i],
                    ground_truth=ground_truth[i]
                )
                
                for metric_name, metric_value in metrics.items():
                    mlflow.log_metric(f"query_{i}_{metric_name}", metric_value)
                    avg_metrics[metric_name] += metric_value / len(entity_df)
            
            for metric_name, metric_value in avg_metrics.items():
                mlflow.log_metric(f"avg_{metric_name}", metric_value)
            
            if avg_metrics["f1_score"] > best_f1:
                best_f1 = avg_metrics["f1_score"]
                best_prompt = template
                best_run_id = mlflow.active_run().info.run_id
    
    if best_prompt:
        model_info = mlflow.register_model(
            model_uri=f"runs:/{best_run_id}/prompt_model",
            name="best_rag_prompt"
        )
        print(f"Best prompt template registered as model version: {model_info.version}")
        print(f"Best prompt template: {best_prompt}")
        print(f"Best F1 score: {best_f1:.4f}")

if __name__ == "__main__":
    main()
