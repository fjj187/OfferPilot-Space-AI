#include "Config/app_config.hpp"

AppConfig::AppConfig()
{
    httpPort=3030;//HTTP服务监听端口
    dbHost="127.0.0.1";//MySQL服务器IP
    dbPort=3306;//MySQL端口
    dbName="";//MySQL数据库名称
    dbUser="root";//MySQL用户名
    dbPassword="";//MySQL密码  
    logLevel="info";//日志级别
}

AppConfig::~AppConfig()
{
}

AppConfig& AppConfig::loadFromEnv()
{
    static AppConfig instance;
    char *path = NULL;      // 用于接收分配的内存
    size_t len = 0;         // 存放长度
    errno_t err;
    err= _dupenv_s(&path, &len, "HTTP_PORT");
    if(err==0&&path!=NULL){
        instance.httpPort=atoi(path);
    }
    err= _dupenv_s(&path, &len, "DB_HOST");
    if(err==0&&path!=NULL){
        instance.dbHost=std::string(path);
    }
    err= _dupenv_s(&path, &len, "DB_PORT");
    if(err==0&&path!=NULL){
        instance.dbPort=atoi(path);
    }   
    err= _dupenv_s(&path, &len, "DB_NAME");
    if(err==0&&path!=NULL){
        instance.dbName=std::string(path);
    }   
    err= _dupenv_s(&path, &len, "DB_USER");
    if(err==0&&path!=NULL){
        instance.dbUser=std::string(path);
    }   
    err= _dupenv_s(&path, &len, "DB_PASSWORD");
    if(err==0&&path!=NULL){
        instance.dbPassword=std::string(path);
    }   
    return instance;
}

AppConfig& AppConfig::getInstance()
{
    static AppConfig instance;

    return instance;
}

bool AppConfig::isConfigValid()
{
    if(httpPort>0&&httpPort<=65535){
        return true;
    }
    else{
        std::cerr<<"Invalid configuration"<<std::endl;
        return false;
    }
    return false;
}
