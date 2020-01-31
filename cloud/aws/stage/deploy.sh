#!/bin/sh


TASK_ARN=$(aws ecs list-tasks --cluster stage --service-name webapp | grep arn | sed 's/"//g')

PENDING_TASK_COUNT=$(aws ecs describe-tasks --cluster stage --tasks $TASK_ARN | grep '"lastStatus": "PENDING"' -c)
RUNNING_TASK_COUNT=$(aws ecs describe-tasks --cluster stage --tasks $TASK_ARN | grep '"lastStatus": "RUNNING"' -c)

if [ $PENDING_TASK_COUNT -ne 0 ] || [ $RUNNING_TASK_COUNT -ne 0 ]; then
    echo "There is a running task....stopping it"

    aws ecs stop-task --cluster stage --task $TASK_ARN

    echo ""
    echo ""
    echo "Waiting for tasks to stop..."
    aws ecs wait tasks-stopped --cluster stage --tasks $TASK_ARN

    
fi