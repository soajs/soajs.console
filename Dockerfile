FROM soajsorg/node

RUN mkdir -p /opt/soajs/soajs.console/node_modules/
WORKDIR /opt/soajs/soajs.console/
COPY . .
RUN npm install

CMD ["/bin/bash"]