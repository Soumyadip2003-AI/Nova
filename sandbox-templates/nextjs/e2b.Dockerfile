# You can use most Debian-based base images
FROM node:22-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx --yes create-next-app@15.3.4 . --yes

RUN npx --yes shadcn@3.5.1 init --yes -b neutral --force
# An explicit list: "add --all" now fails because the registry index lists
# items that no longer exist (code-block, questionnaire, toast, trace).
RUN npx --yes shadcn@3.5.1 add --yes accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button button-group calendar card carousel chart checkbox collapsible command context-menu dialog drawer dropdown-menu empty field form hover-card input input-group input-otp item kbd label menubar navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner spinner switch table tabs textarea toggle toggle-group tooltip

# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app

# The sandbox runs as "user" and the start command uses the last WORKDIR: the
# app must be writable by that user (next dev writes .next, npm writes
# node_modules), and the working directory must still exist.
WORKDIR /home/user
RUN chmod -R a+rwX /home/user
