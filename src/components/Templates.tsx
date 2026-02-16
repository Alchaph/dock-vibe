import { useState, useEffect } from 'react';
import './Templates.css';

interface PortMapping {
  containerPort: string;
  hostPort: string;
}

interface EnvVar {
  key: string;
  value: string;
}

interface Volume {
  source: string;
  target: string;
  readonly: boolean;
}

export interface ContainerTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  image: string;
  ports: PortMapping[];
  volumes: Volume[];
  envVars: EnvVar[];
  network: string;
  restartPolicy: string;
  command: string;
  memoryLimit: string;
  cpuLimit: string;
  isCustom?: boolean;
}

interface TemplatesProps {
  onUseTemplate: (template: ContainerTemplate) => void;
}

// Built-in templates (moved outside component to avoid re-creation)
const BUILTIN_TEMPLATES: ContainerTemplate[] = [
    {
      id: 'postgres',
      name: 'PostgreSQL',
      description: 'PostgreSQL relational database',
      color: '#336791',
      image: 'postgres:latest',
      ports: [{ containerPort: '5432/tcp', hostPort: '5432' }],
      volumes: [{ source: 'postgres-data', target: '/var/lib/postgresql/data', readonly: false }],
      envVars: [
        { key: 'POSTGRES_PASSWORD', value: 'postgres' },
        { key: 'POSTGRES_USER', value: 'postgres' },
        { key: 'POSTGRES_DB', value: 'mydb' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'mysql',
      name: 'MySQL',
      description: 'MySQL relational database',
      color: '#00758F',
      image: 'mysql:latest',
      ports: [{ containerPort: '3306/tcp', hostPort: '3306' }],
      volumes: [{ source: 'mysql-data', target: '/var/lib/mysql', readonly: false }],
      envVars: [
        { key: 'MYSQL_ROOT_PASSWORD', value: 'rootpassword' },
        { key: 'MYSQL_DATABASE', value: 'mydb' },
        { key: 'MYSQL_USER', value: 'user' },
        { key: 'MYSQL_PASSWORD', value: 'password' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'redis',
      name: 'Redis',
      description: 'In-memory data structure store',
      color: '#DC382D',
      image: 'redis:latest',
      ports: [{ containerPort: '6379/tcp', hostPort: '6379' }],
      volumes: [{ source: 'redis-data', target: '/data', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: 'redis-server --appendonly yes',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      description: 'NoSQL document database',
      color: '#47A248',
      image: 'mongo:latest',
      ports: [{ containerPort: '27017/tcp', hostPort: '27017' }],
      volumes: [{ source: 'mongo-data', target: '/data/db', readonly: false }],
      envVars: [
        { key: 'MONGO_INITDB_ROOT_USERNAME', value: 'admin' },
        { key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'password' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'nginx',
      name: 'Nginx',
      description: 'Web server and reverse proxy',
      color: '#009639',
      image: 'nginx:latest',
      ports: [
        { containerPort: '80/tcp', hostPort: '80' },
        { containerPort: '443/tcp', hostPort: '443' }
      ],
      volumes: [
        { source: 'nginx-html', target: '/usr/share/nginx/html', readonly: false },
        { source: 'nginx-conf', target: '/etc/nginx/nginx.conf', readonly: true }
      ],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '128',
      cpuLimit: '0.5'
    },
    {
      id: 'elasticsearch',
      name: 'Elasticsearch',
      description: 'Search and analytics engine',
      color: '#005571',
      image: 'elasticsearch:8.11.0',
      ports: [
        { containerPort: '9200/tcp', hostPort: '9200' },
        { containerPort: '9300/tcp', hostPort: '9300' }
      ],
      volumes: [{ source: 'es-data', target: '/usr/share/elasticsearch/data', readonly: false }],
      envVars: [
        { key: 'discovery.type', value: 'single-node' },
        { key: 'ES_JAVA_OPTS', value: '-Xms512m -Xmx512m' },
        { key: 'xpack.security.enabled', value: 'false' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '1024',
      cpuLimit: '2'
    },
    {
      id: 'rabbitmq',
      name: 'RabbitMQ',
      description: 'Message broker',
      color: '#FF6600',
      image: 'rabbitmq:3-management',
      ports: [
        { containerPort: '5672/tcp', hostPort: '5672' },
        { containerPort: '15672/tcp', hostPort: '15672' }
      ],
      volumes: [{ source: 'rabbitmq-data', target: '/var/lib/rabbitmq', readonly: false }],
      envVars: [
        { key: 'RABBITMQ_DEFAULT_USER', value: 'admin' },
        { key: 'RABBITMQ_DEFAULT_PASS', value: 'password' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'node',
      name: 'Node.js',
      description: 'JavaScript runtime environment',
      color: '#339933',
      image: 'node:20-alpine',
      ports: [{ containerPort: '3000/tcp', hostPort: '3000' }],
      volumes: [{ source: '.', target: '/app', readonly: false }],
      envVars: [{ key: 'NODE_ENV', value: 'development' }],
      network: 'bridge',
      restartPolicy: 'no',
      command: '/bin/sh',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'python',
      name: 'Python',
      description: 'Python runtime environment',
      color: '#3776AB',
      image: 'python:3.11-slim',
      ports: [{ containerPort: '8000/tcp', hostPort: '8000' }],
      volumes: [{ source: '.', target: '/app', readonly: false }],
      envVars: [{ key: 'PYTHONUNBUFFERED', value: '1' }],
      network: 'bridge',
      restartPolicy: 'no',
      command: '/bin/bash',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'mariadb',
      name: 'MariaDB',
      description: 'MySQL-compatible database',
      color: '#003545',
      image: 'mariadb:latest',
      ports: [{ containerPort: '3306/tcp', hostPort: '3307' }],
      volumes: [{ source: 'mariadb-data', target: '/var/lib/mysql', readonly: false }],
      envVars: [
        { key: 'MARIADB_ROOT_PASSWORD', value: 'rootpassword' },
        { key: 'MARIADB_DATABASE', value: 'mydb' },
        { key: 'MARIADB_USER', value: 'user' },
        { key: 'MARIADB_PASSWORD', value: 'password' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'memcached',
      name: 'Memcached',
      description: 'In-memory caching system',
      color: '#4A90E2',
      image: 'memcached:latest',
      ports: [{ containerPort: '11211/tcp', hostPort: '11211' }],
      volumes: [],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: 'memcached -m 64',
      memoryLimit: '128',
      cpuLimit: '0.5'
    },
    {
      id: 'apache',
      name: 'Apache',
      description: 'HTTP web server',
      color: '#D22128',
      image: 'httpd:latest',
      ports: [{ containerPort: '80/tcp', hostPort: '8080' }],
      volumes: [{ source: 'apache-html', target: '/usr/local/apache2/htdocs', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    // Additional Database Templates
    {
      id: 'cockroachdb',
      name: 'CockroachDB',
      description: 'Distributed SQL database',
      color: '#6933FF',
      image: 'cockroachdb/cockroach:latest',
      ports: [
        { containerPort: '26257/tcp', hostPort: '26257' },
        { containerPort: '8080/tcp', hostPort: '8081' }
      ],
      volumes: [{ source: 'cockroach-data', target: '/cockroach/cockroach-data', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: 'start-single-node --insecure',
      memoryLimit: '1024',
      cpuLimit: '2'
    },
    {
      id: 'cassandra',
      name: 'Cassandra',
      description: 'Wide-column NoSQL database',
      color: '#1287B1',
      image: 'cassandra:latest',
      ports: [{ containerPort: '9042/tcp', hostPort: '9042' }],
      volumes: [{ source: 'cassandra-data', target: '/var/lib/cassandra', readonly: false }],
      envVars: [{ key: 'CASSANDRA_CLUSTER_NAME', value: 'MyCluster' }],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '2048',
      cpuLimit: '2'
    },
    {
      id: 'neo4j',
      name: 'Neo4j',
      description: 'Graph database',
      color: '#008CC1',
      image: 'neo4j:latest',
      ports: [
        { containerPort: '7474/tcp', hostPort: '7474' },
        { containerPort: '7687/tcp', hostPort: '7687' }
      ],
      volumes: [{ source: 'neo4j-data', target: '/data', readonly: false }],
      envVars: [{ key: 'NEO4J_AUTH', value: 'neo4j/password' }],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '1024',
      cpuLimit: '1'
    },
    {
      id: 'influxdb',
      name: 'InfluxDB',
      description: 'Time series database',
      color: '#22ADF6',
      image: 'influxdb:latest',
      ports: [{ containerPort: '8086/tcp', hostPort: '8086' }],
      volumes: [{ source: 'influxdb-data', target: '/var/lib/influxdb2', readonly: false }],
      envVars: [
        { key: 'DOCKER_INFLUXDB_INIT_MODE', value: 'setup' },
        { key: 'DOCKER_INFLUXDB_INIT_USERNAME', value: 'admin' },
        { key: 'DOCKER_INFLUXDB_INIT_PASSWORD', value: 'password123' },
        { key: 'DOCKER_INFLUXDB_INIT_ORG', value: 'myorg' },
        { key: 'DOCKER_INFLUXDB_INIT_BUCKET', value: 'mybucket' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'timescaledb',
      name: 'TimescaleDB',
      description: 'PostgreSQL for time-series',
      color: '#FDB515',
      image: 'timescale/timescaledb:latest-pg15',
      ports: [{ containerPort: '5432/tcp', hostPort: '5433' }],
      volumes: [{ source: 'timescale-data', target: '/var/lib/postgresql/data', readonly: false }],
      envVars: [
        { key: 'POSTGRES_PASSWORD', value: 'password' },
        { key: 'POSTGRES_USER', value: 'postgres' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    // Message Queue & Streaming
    {
      id: 'kafka',
      name: 'Apache Kafka',
      description: 'Distributed event streaming',
      color: '#231F20',
      image: 'bitnami/kafka:latest',
      ports: [{ containerPort: '9092/tcp', hostPort: '9092' }],
      volumes: [{ source: 'kafka-data', target: '/bitnami/kafka', readonly: false }],
      envVars: [
        { key: 'KAFKA_CFG_NODE_ID', value: '0' },
        { key: 'KAFKA_CFG_PROCESS_ROLES', value: 'controller,broker' },
        { key: 'KAFKA_CFG_LISTENERS', value: 'PLAINTEXT://:9092,CONTROLLER://:9093' },
        { key: 'KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP', value: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT' },
        { key: 'KAFKA_CFG_CONTROLLER_QUORUM_VOTERS', value: '0@localhost:9093' },
        { key: 'KAFKA_CFG_CONTROLLER_LISTENER_NAMES', value: 'CONTROLLER' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '1024',
      cpuLimit: '2'
    },
    {
      id: 'nats',
      name: 'NATS',
      description: 'Cloud-native messaging system',
      color: '#27AAE1',
      image: 'nats:latest',
      ports: [
        { containerPort: '4222/tcp', hostPort: '4222' },
        { containerPort: '8222/tcp', hostPort: '8222' }
      ],
      volumes: [],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    {
      id: 'activemq',
      name: 'ActiveMQ',
      description: 'Java message broker',
      color: '#D24939',
      image: 'apache/activemq-classic:latest',
      ports: [
        { containerPort: '61616/tcp', hostPort: '61616' },
        { containerPort: '8161/tcp', hostPort: '8161' }
      ],
      volumes: [{ source: 'activemq-data', target: '/opt/apache-activemq/data', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    // Monitoring & Observability
    {
      id: 'prometheus',
      name: 'Prometheus',
      description: 'Metrics and monitoring',
      color: '#E6522C',
      image: 'prom/prometheus:latest',
      ports: [{ containerPort: '9090/tcp', hostPort: '9090' }],
      volumes: [
        { source: 'prometheus-data', target: '/prometheus', readonly: false },
        { source: 'prometheus-config', target: '/etc/prometheus/prometheus.yml', readonly: true }
      ],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'grafana',
      name: 'Grafana',
      description: 'Analytics and monitoring UI',
      color: '#F46800',
      image: 'grafana/grafana:latest',
      ports: [{ containerPort: '3000/tcp', hostPort: '3001' }],
      volumes: [{ source: 'grafana-data', target: '/var/lib/grafana', readonly: false }],
      envVars: [
        { key: 'GF_SECURITY_ADMIN_PASSWORD', value: 'admin' },
        { key: 'GF_SECURITY_ADMIN_USER', value: 'admin' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    {
      id: 'jaeger',
      name: 'Jaeger',
      description: 'Distributed tracing system',
      color: '#60D0E4',
      image: 'jaegertracing/all-in-one:latest',
      ports: [
        { containerPort: '16686/tcp', hostPort: '16686' },
        { containerPort: '14268/tcp', hostPort: '14268' }
      ],
      volumes: [],
      envVars: [{ key: 'COLLECTOR_ZIPKIN_HOST_PORT', value: ':9411' }],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    // Development Tools
    {
      id: 'jenkins',
      name: 'Jenkins',
      description: 'CI/CD automation server',
      color: '#D24939',
      image: 'jenkins/jenkins:lts',
      ports: [
        { containerPort: '8080/tcp', hostPort: '8082' },
        { containerPort: '50000/tcp', hostPort: '50000' }
      ],
      volumes: [{ source: 'jenkins-data', target: '/var/jenkins_home', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '1024',
      cpuLimit: '2'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      description: 'DevOps platform',
      color: '#FC6D26',
      image: 'gitlab/gitlab-ce:latest',
      ports: [
        { containerPort: '80/tcp', hostPort: '8083' },
        { containerPort: '443/tcp', hostPort: '8443' },
        { containerPort: '22/tcp', hostPort: '2222' }
      ],
      volumes: [
        { source: 'gitlab-config', target: '/etc/gitlab', readonly: false },
        { source: 'gitlab-logs', target: '/var/log/gitlab', readonly: false },
        { source: 'gitlab-data', target: '/var/opt/gitlab', readonly: false }
      ],
      envVars: [{ key: 'GITLAB_OMNIBUS_CONFIG', value: 'external_url "http://localhost:8083"' }],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '4096',
      cpuLimit: '4'
    },
    {
      id: 'sonarqube',
      name: 'SonarQube',
      description: 'Code quality analysis',
      color: '#4E9BCD',
      image: 'sonarqube:community',
      ports: [{ containerPort: '9000/tcp', hostPort: '9000' }],
      volumes: [
        { source: 'sonarqube-data', target: '/opt/sonarqube/data', readonly: false },
        { source: 'sonarqube-logs', target: '/opt/sonarqube/logs', readonly: false },
        { source: 'sonarqube-extensions', target: '/opt/sonarqube/extensions', readonly: false }
      ],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '2048',
      cpuLimit: '2'
    },
    {
      id: 'minio',
      name: 'MinIO',
      description: 'S3-compatible object storage',
      color: '#C72C48',
      image: 'minio/minio:latest',
      ports: [
        { containerPort: '9000/tcp', hostPort: '9001' },
        { containerPort: '9001/tcp', hostPort: '9002' }
      ],
      volumes: [{ source: 'minio-data', target: '/data', readonly: false }],
      envVars: [
        { key: 'MINIO_ROOT_USER', value: 'minioadmin' },
        { key: 'MINIO_ROOT_PASSWORD', value: 'minioadmin' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: 'server /data --console-address :9001',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    // CMS & Applications
    {
      id: 'wordpress',
      name: 'WordPress',
      description: 'Content management system',
      color: '#21759B',
      image: 'wordpress:latest',
      ports: [{ containerPort: '80/tcp', hostPort: '8084' }],
      volumes: [{ source: 'wordpress-data', target: '/var/www/html', readonly: false }],
      envVars: [
        { key: 'WORDPRESS_DB_HOST', value: 'mysql:3306' },
        { key: 'WORDPRESS_DB_USER', value: 'wordpress' },
        { key: 'WORDPRESS_DB_PASSWORD', value: 'wordpress' },
        { key: 'WORDPRESS_DB_NAME', value: 'wordpress' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'ghost',
      name: 'Ghost',
      description: 'Modern publishing platform',
      color: '#15171A',
      image: 'ghost:latest',
      ports: [{ containerPort: '2368/tcp', hostPort: '2368' }],
      volumes: [{ source: 'ghost-data', target: '/var/lib/ghost/content', readonly: false }],
      envVars: [
        { key: 'url', value: 'http://localhost:2368' },
        { key: 'database__client', value: 'sqlite3' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'nextcloud',
      name: 'Nextcloud',
      description: 'Self-hosted cloud storage',
      color: '#0082C9',
      image: 'nextcloud:latest',
      ports: [{ containerPort: '80/tcp', hostPort: '8085' }],
      volumes: [{ source: 'nextcloud-data', target: '/var/www/html', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '1024',
      cpuLimit: '1'
    },
    // Additional Web Servers & Proxies
    {
      id: 'traefik',
      name: 'Traefik',
      description: 'Modern reverse proxy',
      color: '#24A1C1',
      image: 'traefik:latest',
      ports: [
        { containerPort: '80/tcp', hostPort: '8086' },
        { containerPort: '8080/tcp', hostPort: '8087' }
      ],
      volumes: [{ source: '/var/run/docker.sock', target: '/var/run/docker.sock', readonly: true }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '--api.insecure=true --providers.docker',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    {
      id: 'caddy',
      name: 'Caddy',
      description: 'Web server with auto HTTPS',
      color: '#1F88C0',
      image: 'caddy:latest',
      ports: [
        { containerPort: '80/tcp', hostPort: '8088' },
        { containerPort: '443/tcp', hostPort: '8444' }
      ],
      volumes: [
        { source: 'caddy-data', target: '/data', readonly: false },
        { source: 'caddy-config', target: '/config', readonly: false }
      ],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    {
      id: 'haproxy',
      name: 'HAProxy',
      description: 'Load balancer',
      color: '#106DA9',
      image: 'haproxy:latest',
      ports: [
        { containerPort: '80/tcp', hostPort: '8089' },
        { containerPort: '8404/tcp', hostPort: '8404' }
      ],
      volumes: [{ source: 'haproxy-config', target: '/usr/local/etc/haproxy/haproxy.cfg', readonly: true }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    // Additional Runtimes
    {
      id: 'golang',
      name: 'Go',
      description: 'Go programming language',
      color: '#00ADD8',
      image: 'golang:latest',
      ports: [{ containerPort: '8080/tcp', hostPort: '8090' }],
      volumes: [{ source: '.', target: '/go/src/app', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'no',
      command: '/bin/bash',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'rust',
      name: 'Rust',
      description: 'Rust programming language',
      color: '#CE422B',
      image: 'rust:latest',
      ports: [{ containerPort: '8080/tcp', hostPort: '8091' }],
      volumes: [{ source: '.', target: '/usr/src/app', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'no',
      command: '/bin/bash',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'php',
      name: 'PHP',
      description: 'PHP with Apache',
      color: '#777BB4',
      image: 'php:apache',
      ports: [{ containerPort: '80/tcp', hostPort: '8092' }],
      volumes: [{ source: '.', target: '/var/www/html', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'ruby',
      name: 'Ruby',
      description: 'Ruby programming language',
      color: '#CC342D',
      image: 'ruby:latest',
      ports: [{ containerPort: '3000/tcp', hostPort: '3002' }],
      volumes: [{ source: '.', target: '/app', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'no',
      command: '/bin/bash',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    // Utilities
    {
      id: 'portainer',
      name: 'Portainer',
      description: 'Docker management UI',
      color: '#13BEF9',
      image: 'portainer/portainer-ce:latest',
      ports: [
        { containerPort: '9000/tcp', hostPort: '9003' },
        { containerPort: '8000/tcp', hostPort: '8001' }
      ],
      volumes: [
        { source: '/var/run/docker.sock', target: '/var/run/docker.sock', readonly: false },
        { source: 'portainer-data', target: '/data', readonly: false }
      ],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    {
      id: 'registry',
      name: 'Docker Registry',
      description: 'Private Docker registry',
      color: '#384D54',
      image: 'registry:2',
      ports: [{ containerPort: '5000/tcp', hostPort: '5000' }],
      volumes: [{ source: 'registry-data', target: '/var/lib/registry', readonly: false }],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '256',
      cpuLimit: '0.5'
    },
    {
      id: 'vault',
      name: 'HashiCorp Vault',
      description: 'Secrets management',
      color: '#000000',
      image: 'hashicorp/vault:latest',
      ports: [{ containerPort: '8200/tcp', hostPort: '8200' }],
      volumes: [{ source: 'vault-data', target: '/vault/file', readonly: false }],
      envVars: [
        { key: 'VAULT_DEV_ROOT_TOKEN_ID', value: 'root' },
        { key: 'VAULT_DEV_LISTEN_ADDRESS', value: '0.0.0.0:8200' }
      ],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: 'server -dev',
      memoryLimit: '512',
      cpuLimit: '1'
    },
    {
      id: 'adminer',
      name: 'Adminer',
      description: 'Database management UI',
      color: '#34567C',
      image: 'adminer:latest',
      ports: [{ containerPort: '8080/tcp', hostPort: '8093' }],
      volumes: [],
      envVars: [],
      network: 'bridge',
      restartPolicy: 'unless-stopped',
      command: '',
      memoryLimit: '128',
      cpuLimit: '0.5'
    }
  ];

function Templates({ onUseTemplate }: TemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customTemplates, setCustomTemplates] = useState<ContainerTemplate[]>([]);

  // Load custom templates from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('customTemplates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomTemplates(parsed);
      } catch (err) {
        console.error('Failed to load custom templates:', err);
      }
    }
  }, []);

  // Save custom templates to localStorage whenever they change
  useEffect(() => {
    if (customTemplates.length > 0) {
      localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
    }
  }, [customTemplates]);

  // Combine built-in and custom templates
  const allTemplates = [...BUILTIN_TEMPLATES, ...customTemplates];

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'custom', name: 'My Templates' },
    { id: 'database', name: 'Databases', filter: ['postgres', 'mysql', 'mongodb', 'mariadb', 'cockroachdb', 'cassandra', 'neo4j', 'influxdb', 'timescaledb'] },
    { id: 'cache', name: 'Caching', filter: ['redis', 'memcached'] },
    { id: 'web', name: 'Web Servers', filter: ['nginx', 'apache', 'traefik', 'caddy', 'haproxy'] },
    { id: 'runtime', name: 'Runtimes', filter: ['node', 'python', 'golang', 'rust', 'php', 'ruby'] },
    { id: 'messaging', name: 'Messaging', filter: ['rabbitmq', 'kafka', 'nats', 'activemq'] },
    { id: 'monitoring', name: 'Monitoring', filter: ['prometheus', 'grafana', 'jaeger'] },
    { id: 'devtools', name: 'Dev Tools', filter: ['jenkins', 'gitlab', 'sonarqube', 'minio'] },
    { id: 'cms', name: 'CMS & Apps', filter: ['wordpress', 'ghost', 'nextcloud'] },
    { id: 'utilities', name: 'Utilities', filter: ['portainer', 'registry', 'vault', 'adminer', 'elasticsearch'] }
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? allTemplates
    : selectedCategory === 'custom'
    ? customTemplates
    : allTemplates.filter(t => {
        const category = categories.find(c => c.id === selectedCategory);
        return category && 'filter' in category && category.filter?.includes(t.id);
      });

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this custom template?')) {
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleExportTemplate = (template: ContainerTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.id}-template.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const template = JSON.parse(e.target?.result as string);
            template.isCustom = true;
            // Ensure unique ID
            template.id = `custom-${Date.now()}`;
            setCustomTemplates(prev => [...prev, template]);
          } catch (err) {
            alert('Failed to import template: Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportAll = () => {
    const dataStr = JSON.stringify(customTemplates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'custom-templates.json';
    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="templates-container">
      <div className="templates-header">
        <div>
          <h2>Container Templates</h2>
          <p className="templates-subtitle">
            Quick-start templates for common applications ({allTemplates.length} templates, {customTemplates.length} custom)
          </p>
        </div>
        <div className="templates-actions">
          <button onClick={handleImportTemplate} className="btn btn-secondary">
            Import Template
          </button>
          {customTemplates.length > 0 && (
            <button onClick={handleExportAll} className="btn btn-secondary">
              Export All Custom
            </button>
          )}
        </div>
      </div>

      <div className="templates-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
            {category.id === 'custom' && customTemplates.length > 0 && ` (${customTemplates.length})`}
          </button>
        ))}
      </div>

      <div className="templates-grid">
        {filteredTemplates.map(template => (
          <div key={template.id} className="template-card">
            <div className="template-icon" style={{ backgroundColor: template.color }}>
              {template.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="template-info">
              <h3>
                {template.name}
                {template.isCustom && <span className="custom-badge">CUSTOM</span>}
              </h3>
              <p className="template-description">{template.description}</p>
              <div className="template-details">
                <span className="template-tag">Image: {template.image.split(':')[0]}</span>
                {template.ports.length > 0 && (
                  <span className="template-tag">
                    Ports: {template.ports.map(p => p.hostPort).join(', ')}
                  </span>
                )}
                {template.memoryLimit && (
                  <span className="template-tag">Memory: {template.memoryLimit}MB</span>
                )}
              </div>
            </div>
            <div className="template-card-actions">
              <button
                className="btn-use-template"
                onClick={() => onUseTemplate(template)}
              >
                Use Template
              </button>
              {template.isCustom && (
                <>
                  <button
                    className="btn-template-action btn-export"
                    onClick={() => handleExportTemplate(template)}
                    title="Export template"
                  >
                    Export
                  </button>
                  <button
                    className="btn-template-action btn-delete"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete template"
                  >
                    Delete
                  </button>
                </>
              )}
              {!template.isCustom && (
                <button
                  className="btn-template-action btn-export"
                  onClick={() => handleExportTemplate(template)}
                  title="Export template"
                >
                  Export
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="templates-empty">
          <p>No templates found in this category</p>
        </div>
      )}
    </div>
  );
}

export default Templates;
