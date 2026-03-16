# Reflections:
The assignment was clear, I was to build a event driven AWS CDK application which handles events through EventBridge, validates and transforms data and persists it to a MongoDB database.
I thought the assignemnt got a good flow and the structure became clear to set up.


### What I liked the most
The most fun part was figuring out edge cases like MongoDB connection failures and malformed events, also solving connectivity issues through retry logic and dead letter queues. I implemented idempotent operations using MongoDB's compound `_id` strategy so that events could be safely processed.

###  What could have gone better?
One hiccup was due to my limited knowledge of the LocalStack Community limitations. It does not have multi region support. It forces you to use the region us-east-1 instead of what I usually default to, eu-west-1.


## Feedback on the test:
The assignment is well designed with a good balance between infrastructure, logic, validation/testing and points out the importance of security. A natural step for me was trying to find edge test cases and consider the whole picture, end to end for possible challenges.


## Use of AI:
I have used AI to support in validation of code and for input on solution design. I used it to help me with reviewing logic and give me feedback on what to improve after implementation.