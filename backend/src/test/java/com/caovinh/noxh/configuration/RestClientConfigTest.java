package com.caovinh.noxh.configuration;

import com.caovinh.noxh.service.ImageKitService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class RestClientConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withPropertyValues(
                    "imagekit.upload-url=https://upload.imagekit.io/api/v1/files/upload",
                    "imagekit.private-key=test-private-key",
                    "imagekit.folder=/NOXH")
            .withUserConfiguration(RestClientConfig.class, ImageKitService.class);

    @Test
    void context_withImageKitService_registersRestClientBuilder() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(ImageKitService.class);
            assertThat(context).hasSingleBean(RestClient.Builder.class);
        });
    }
}
