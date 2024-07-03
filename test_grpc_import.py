import os
import sys

def main():
    try:
        import grpc_tools.protoc
        print("grpc_tools.protoc imported successfully.")
    except ImportError as e:
        print(f"Failed to import grpc_tools.protoc: {e}")

if __name__ == "__main__":
    print(f"Current PATH: {os.environ['PATH']}")
    print(f"Python Executable: {sys.executable}")
    print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', '')}")
    print(f"sys.path: {sys.path}")
    main()
