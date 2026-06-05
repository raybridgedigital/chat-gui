#!/bin/bash

cd ~/projects/chat-gui/backend
source venv/bin/activate
uvicorn main:app --reload
