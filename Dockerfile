FROM node:latest

# Make app dir
RUN mkdir /opt/atls/

# Required port
EXPOSE 8080

# Start chatbot
ENTRYPOINT ["/opt/atls/etc/entrypoint.sh"]
