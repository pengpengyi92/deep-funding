FROM nginx:1.28-alpine
COPY site/ /usr/share/nginx/html/
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY 15-validate-origin.sh /docker-entrypoint.d/15-validate-origin.sh
RUN chmod +x /docker-entrypoint.d/15-validate-origin.sh
ENV STUDIO_PUBLIC_ORIGIN=https://unconfigured.invalid
EXPOSE 7860

